package com.bluepal.service.impl;

import com.bluepal.dto.request.RecipeRequest;
import com.bluepal.dto.response.RecipeResponse;
import com.bluepal.entity.*;
import com.bluepal.exception.ResourceNotFoundException;
import com.bluepal.repository.*;
import com.bluepal.service.interfaces.NotificationService;
import com.bluepal.service.interfaces.RecipeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class RecipeServiceImpl implements RecipeService {

	private static final String ROLE_ADMIN = "ROLE_ADMIN";
	private static final String USERNAME = "username";
	private static final String RECIPE = "Recipe";
	private static final String ID = "id";
	private static final String USER = "User";
	private static final String NEXT_CURSOR = "nextCursor";
	private static final String CONTENT = "content";
	private static final String CREATED_AT = "createdAt";
	private static final String LIKE_COUNT_KEY = "likeCount";

	private final RecipeRepository recipeRepository;
	private final UserRepository userRepository;
	private final NotificationRepository notificationRepository;
	private final MealPlanRepository mealPlanRepository;
	private final ShoppingListItemRepository shoppingListItemRepository;
	private final LikeRepository likeRepository;
	private final CommentRepository commentRepository;
	private final BookmarkRepository bookmarkRepository;
	private final RatingRepository ratingRepository;
	private final CategoryRepository categoryRepository;
	private final com.bluepal.service.interfaces.RatingService ratingService;
	private final com.bluepal.service.interfaces.BookmarkService bookmarkService;
	private final NotificationService notificationService;
	private final com.bluepal.service.interfaces.UserService userService;

	public RecipeServiceImpl(RecipeRepository recipeRepository, UserRepository userRepository,
			NotificationRepository notificationRepository, MealPlanRepository mealPlanRepository,
			ShoppingListItemRepository shoppingListItemRepository,
			LikeRepository likeRepository, CommentRepository commentRepository,
			BookmarkRepository bookmarkRepository, RatingRepository ratingRepository,
			CategoryRepository categoryRepository,
			com.bluepal.service.interfaces.RatingService ratingService,
			@Lazy com.bluepal.service.interfaces.BookmarkService bookmarkService,
			NotificationService notificationService,
			@Lazy com.bluepal.service.interfaces.UserService userService) {
		this.recipeRepository = recipeRepository;
		this.userRepository = userRepository;
		this.notificationRepository = notificationRepository;
		this.mealPlanRepository = mealPlanRepository;
		this.shoppingListItemRepository = shoppingListItemRepository;
		this.likeRepository = likeRepository;
		this.commentRepository = commentRepository;
		this.bookmarkRepository = bookmarkRepository;
		this.ratingRepository = ratingRepository;
		this.categoryRepository = categoryRepository;
		this.ratingService = ratingService;
		this.bookmarkService = bookmarkService;
		this.notificationService = notificationService;
		this.userService = userService;
	}

	@Override
	public List<RecipeResponse> searchRecipesFullText(String query, String currentUsername) {
		// PostgreSQL ILIKE search handles standard string tokens
		return recipeRepository.searchRecipesFullText(query.trim()).stream()
				.map(r -> this.mapToResponse(r, currentUsername)).toList();
	}

	@Override
	@Transactional
	public RecipeResponse createRecipe(RecipeRequest request, String username) {
		log.debug("Creating recipe for user: {}", username);
		User author = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

		validateAuthorAccess(author, request);

		Category category = resolveCategory(request.getCategory());

		Recipe recipe = buildRecipeEntity(request, author, category);

		processRecipeDetails(recipe, request);

		Recipe savedRecipe = recipeRepository.save(recipe);

		updateAuthorReputation(author);

		return mapToResponse(savedRecipe, username);
	}

	private void validateAuthorAccess(User author, RecipeRequest request) {
		if (author.isRestricted()) {
			throw new org.springframework.security.access.AccessDeniedException(
					"Your account is restricted. You cannot post recipes.");
		}

		if (request.isPremium()) {
			boolean isPremium = author.hasActivePremium();
			boolean isAdmin = author.getRoles().contains(ROLE_ADMIN);
			if (!isPremium && !isAdmin) {
				throw new com.bluepal.exception.PremiumRequiredException(
						"You must be a premium member to create premium recipes.");
			}
		}
	}

	private Category resolveCategory(String categoryName) {
		if (categoryName != null && !categoryName.isBlank()) {
			String name = categoryName.trim();
			return categoryRepository.findByNameIgnoreCase(name)
					.orElseGet(() -> categoryRepository.save(new Category(name)));
		}
		return categoryRepository.findByNameIgnoreCase("General")
				.orElseGet(() -> categoryRepository.save(new Category("General")));
	}

	private Recipe buildRecipeEntity(RecipeRequest request, User author, Category category) {
		Recipe recipe = Recipe.builder()
				.author(author)
				.category(category)
				.likeCount(0)
				.commentCount(0)
				.build();
		applyRequestToEntity(recipe, request);
		return recipe;
	}

	private void applyRequestToEntity(Recipe recipe, RecipeRequest request) {
		recipe.setTitle(request.getTitle());
		recipe.setDescription(request.getDescription());
		recipe.setImageUrl(request.getImageUrl());
		recipe.setPrepTimeMinutes(request.getPrepTimeMinutes());
		recipe.setCookTimeMinutes(request.getCookTimeMinutes());
		recipe.setServings(request.getServings());
		recipe.setPublished(request.isPublished());
		recipe.setPremium(request.isPremium());
		recipe.setCalories(request.getCalories());
		recipe.setProtein(request.getProtein());
		recipe.setCarbs(request.getCarbs());
		recipe.setFats(request.getFats());
	}

	private void processRecipeDetails(Recipe recipe, RecipeRequest request) {
		if (request.getIngredients() != null) {
			request.getIngredients().forEach(ir -> {
				ShoppingCategory ingCat = ShoppingCategory.OTHER;
				if (ir.getCategory() != null) {
					try {
						ingCat = ShoppingCategory.valueOf(ir.getCategory().toUpperCase());
					} catch (IllegalArgumentException e) {
						log.warn("Invalid ingredient category: {}, defaulting to OTHER", ir.getCategory());
					}
				}
				recipe.addIngredient(Ingredient.builder()
						.name(ir.getName())
						.quantity(ir.getQuantity())
						.unit(ir.getUnit())
						.category(ingCat)
						.build());
			});
		}

		if (request.getSteps() != null) {
			request.getSteps().forEach(sr -> recipe
					.addStep(Step.builder().stepNumber(sr.getStepNumber()).instruction(sr.getInstruction()).build()));
		}

		if (request.getAdditionalImages() != null) {
			request.getAdditionalImages().forEach(url -> recipe.addImage(RecipeImage.builder().imageUrl(url).build()));
		}
	}

	private void updateAuthorReputation(User author) {
		int currentPoints = author.getReputationPoints() != null ? author.getReputationPoints() : 0;
		author.setReputationPoints(currentPoints + 50);

		if (author.getReputationPoints() >= 1000)
			author.setReputationLevel("Sous Chef");
		else if (author.getReputationPoints() >= 500)
			author.setReputationLevel("Chef de Partie");
		else
			author.setReputationLevel("Commis Chef");

		userRepository.save(author);
	}

	// Helper method to check if current user liked the recipe
	private boolean checkIsLiked(Recipe recipe, String username) {
		if (username == null)
			return false;
		return userRepository.findFirstByUsername(username).map(user -> likeRepository.existsByUserAndRecipe(user, recipe))
				.orElse(false);
	}

	// The Mapping Method that fixes your Compilation Error
	public RecipeResponse mapToResponse(Recipe recipe, String currentUsername) {
		try {
			boolean isLiked = checkIsLiked(recipe, currentUsername);
			User currentUser = currentUsername != null ? userRepository.findFirstByUsername(currentUsername).orElse(null)
					: null;
			boolean isBookmarked = currentUser != null && bookmarkService.isBookmarked(currentUser, recipe.getId());
			int userRating = currentUser != null ? ratingService.getUserRating(currentUser, recipe) : 0;

			return RecipeResponse.builder().id(recipe.getId()).title(recipe.getTitle())
					.description(recipe.getDescription())
					.imageUrl(recipe.getImageUrl()).prepTimeMinutes(recipe.getPrepTimeMinutes())
					.cookTimeMinutes(recipe.getCookTimeMinutes()).servings(recipe.getServings())
					.calories(recipe.getCalories()).protein(recipe.getProtein()).carbs(recipe.getCarbs())
					.fats(recipe.getFats())
					.likeCount(recipe.getLikeCount()).commentCount(recipe.getCommentCount())
					.averageRating(recipe.getAverageRating()).ratingCount(recipe.getRatingCount())
					.category(recipe.getCategory() != null ? recipe.getCategory().getName() : null).isLiked(isLiked)
					.isBookmarked(isBookmarked).userRating(userRating)
					.isPublished(recipe.isPublished())
					.isPremium(recipe.isPremium())
					.content(recipe.getContent()) // Map content field
					.additionalImages(
							recipe.getImages().stream().map(RecipeImage::getImageUrl).toList())
					.createdAt(recipe.getCreatedAt())
					.author(recipe.getAuthor() != null
							? RecipeResponse.AuthorDto.builder().id(recipe.getAuthor().getId())
									.username(recipe.getAuthor().getUsername())
									.isVerified(recipe.getAuthor().isVerified())
									.profilePictureUrl(recipe.getAuthor().getProfilePictureUrl()).build()
							: null)
					.ingredients(recipe.getIngredients().stream()
							.map(i -> RecipeResponse.IngredientDto.builder().id(i.getId()).name(i.getName())
									.quantity(i.getQuantity()).unit(i.getUnit())
									.category(i.getCategory() != null ? i.getCategory().name() : null).build())
							.toList())
					.steps(recipe
							.getSteps().stream().map(s -> RecipeResponse.StepDto.builder().id(s.getId())
									.stepNumber(s.getStepNumber()).instruction(s.getInstruction()).build())
							.toList())
					.build();
		} catch (Exception e) {
			log.error("CRITICAL ERROR in mapToResponse for recipe {}: {}", recipe.getId(), e.getMessage());
			throw e;
		}
	}

	@Override
	@Transactional(readOnly = true)
	public RecipeResponse getRecipeById(Long id, String currentUsername) {
		Recipe recipe = recipeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(RECIPE, ID, id));

		validateRecipeReadAccess(recipe, currentUsername);

		return mapToResponse(recipe, currentUsername);
	}

	private void validateRecipeReadAccess(Recipe recipe, String currentUsername) {
		checkRestrictedStatus(recipe, currentUsername);
		checkPremiumStatus(recipe, currentUsername);
	}

	private void checkRestrictedStatus(Recipe recipe, String currentUsername) {
		if (recipe.getStatus() == RecipeStatus.RESTRICTED) {
			User user = currentUsername != null ? userRepository.findByUsernameIgnoreCase(currentUsername).orElse(null)
					: null;
			boolean isAdmin = user != null && user.getRoles().contains(ROLE_ADMIN);
			if (!isAdmin) {
				throw new ResourceNotFoundException(RECIPE, ID, recipe.getId());
			}
		}
	}

	private void checkPremiumStatus(Recipe recipe, String currentUsername) {
		if (recipe.isPremium()) {
			User user = currentUsername != null
					? userRepository.findFirstByUsernameIgnoreCasePrioritizePremium(currentUsername).orElse(null)
					: null;

			boolean isAuthor = isAuthor(recipe, user);
			boolean isAdmin = isAdmin(user);
			boolean isPremium = user != null && user.hasActivePremium();

			log.debug("[RecipeAccess] User matched: {}", (user != null ? user.getUsername() + " (ID: " + user.getId() + ")" : "NONE"));
			log.debug("[RecipeAccess] isAuthor: {}, isAdmin: {}, isPremium: {}", isAuthor, isAdmin, isPremium);

			if (!isAdmin && !isAuthor && !isPremium) {
				log.error("[RecipeAccess] ACCESS DENIED - ID: {}, User: {}", recipe.getId(), (user != null ? user.getUsername() : "null"));
				throw new com.bluepal.exception.PremiumRequiredException(
						"This is a premium recipe. Please upgrade to view.");
			}
			log.debug("[RecipeAccess] ACCESS GRANTED");
		}
	}

	private boolean isAuthor(Recipe recipe, User user) {
		if (user == null || recipe.getAuthor() == null) return false;
		return (recipe.getAuthor().getId() != null && recipe.getAuthor().getId().equals(user.getId())) ||
				(recipe.getAuthor().getUsername() != null && recipe.getAuthor().getUsername().equalsIgnoreCase(user.getUsername()));
	}

	private boolean isAdmin(User user) {
		if (user == null) return false;
		return user.getRoles().contains(ROLE_ADMIN) || user.getRoles().contains("ADMIN");
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> getExploreFeedCursor(LocalDateTime cursor, int size, String currentUsername) {
		try {
			List<Recipe> recipes;
			Pageable limit = PageRequest.of(0, size);

			if (cursor == null) {
				recipes = recipeRepository.findAllByIsPublishedTrueOrderByCreatedAtDesc(limit);
			} else {
				recipes = recipeRepository.findExploreCursorPublished(cursor, limit);
			}

			List<RecipeResponse> contentList = recipes.stream().map(r -> this.mapToResponse(r, currentUsername))
					.toList();

			String nextCursorStr = contentList.isEmpty() ? "" : contentList.get(contentList.size() - 1).getCreatedAt().toString();

			return Map.of(CONTENT, contentList, NEXT_CURSOR, nextCursorStr);
		} catch (Exception e) {
			return Map.of(CONTENT, List.of(), NEXT_CURSOR, "");
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> getPersonalizedFeedCursor(String username, LocalDateTime cursor, int size) {
		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

		Pageable limit = PageRequest.of(0, size);
		List<Recipe> recipes;

		if (cursor == null) {
			recipes = recipeRepository.findPersonalizedLatest(user, limit);
		} else {
			recipes = recipeRepository.findPersonalizedCursor(user, cursor, limit);
		}

		List<RecipeResponse> content = recipes.stream().map(r -> this.mapToResponse(r, username))
				.toList();

		String nextCursor = content.isEmpty() ? "" : content.get(content.size() - 1).getCreatedAt().toString();

		return Map.of(CONTENT, content, NEXT_CURSOR, nextCursor);
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> getUserRecipes(Long userId, LocalDateTime cursor, int size, String currentUsername) {
		try {
			User author = userRepository.findById(userId)
					.orElseThrow(() -> new ResourceNotFoundException(USER, ID, userId));

			Pageable limit = PageRequest.of(0, size);
			List<Recipe> recipes;

			boolean isSelf = author.getUsername().equals(currentUsername);

			if (cursor == null) {
				if (isSelf) {
					recipes = recipeRepository.findByAuthorOrderByCreatedAtDesc(author, limit);
				} else {
					recipes = recipeRepository.findByAuthorAndIsPublishedTrueOrderByCreatedAtDesc(author, limit);
				}
			} else {
				if (isSelf) {
					recipes = recipeRepository.findUserRecipesCursor(author, cursor, limit);
				} else {
					recipes = recipeRepository.findUserRecipesCursorPublished(author, cursor, limit);
				}
			}

			log.debug("Found {} recipes for user ID {}", recipes.size(), userId);

			List<RecipeResponse> content = recipes.stream().map(r -> this.mapToResponse(r, currentUsername))
					.toList();

			String nextCursorOfResults = content.isEmpty() ? "" : content.get(content.size() - 1).getCreatedAt().toString();

			return Map.of(CONTENT, content, NEXT_CURSOR, nextCursorOfResults);
		} catch (Exception e) {
			log.error("FATAL ERROR in getUserRecipes for ID {}: {}", userId, e.getMessage());
			return Map.of(CONTENT, List.of(), NEXT_CURSOR, "", "error", e.getMessage());
		}
	}

	@Override
	@Transactional
	public void markAsPremium(Long id) {
		Recipe recipe = recipeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(RECIPE, ID, id));
		recipe.setPremium(true);
		recipeRepository.save(recipe);
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> getUserLikedRecipes(Long userId, LocalDateTime cursor, int size,
			String currentUsername) {
		try {
			User user = userRepository.findById(userId)
					.orElseThrow(() -> new ResourceNotFoundException(USER, ID, userId));

			Pageable limit = PageRequest.of(0, size);
			List<Recipe> recipes;

			if (cursor == null) {
				recipes = recipeRepository.findLikedRecipesByUser(user, limit);
			} else {
				recipes = recipeRepository.findLikedRecipesCursor(user, cursor, limit);
			}

			List<RecipeResponse> content = recipes.stream().map(r -> this.mapToResponse(r, currentUsername))
					.toList();

			String nextCursorOfResults = content.isEmpty() ? "" : content.get(content.size() - 1).getCreatedAt().toString();

			return Map.of(CONTENT, content, NEXT_CURSOR, nextCursorOfResults);
		} catch (Exception e) {
			log.error("ERROR: Failed to fetch liked recipes for ID {}: {}", userId, e.getMessage());
			return Map.of(CONTENT, List.of(), NEXT_CURSOR, "");
		}
	}

	@Override
	@Transactional
	public RecipeResponse updateRecipe(Long id, RecipeRequest request, String username) {
		Recipe recipe = recipeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(RECIPE, ID, id));

		validateUpdateAccess(recipe, username);

		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

		checkPremiumManagementAccess(user, request);

		updateRecipeBasicInfo(recipe, request);
		updateRecipeDetails(recipe, request);

		return mapToResponse(recipeRepository.save(recipe), username);
	}

	private void validateUpdateAccess(Recipe recipe, String username) {
		if (!recipe.getAuthor().getUsername().equals(username)) {
			throw new org.springframework.security.access.AccessDeniedException("You are not authorized to update this recipe");
		}
	}

	private void checkPremiumManagementAccess(User user, RecipeRequest request) {
		if (request.isPremium()) {
			boolean isPremium = user.hasActivePremium();
			boolean isAdmin = user.getRoles().contains(ROLE_ADMIN);
			if (!isPremium && !isAdmin) {
				throw new com.bluepal.exception.PremiumRequiredException(
						"You must be a premium member to manage premium recipes.");
			}
		}
	}

	private void updateRecipeBasicInfo(Recipe recipe, RecipeRequest request) {
		applyRequestToEntity(recipe, request);

		if (request.getCategory() != null && !request.getCategory().isBlank()) {
			String catName = request.getCategory().trim();
			Category category = categoryRepository.findByNameIgnoreCase(catName)
					.orElseGet(() -> categoryRepository.save(new Category(catName)));
			recipe.setCategory(category);
		}
	}

	private void updateRecipeDetails(Recipe recipe, RecipeRequest request) {
		new java.util.ArrayList<>(recipe.getIngredients()).forEach(recipe::removeIngredient);
		processRecipeDetails(recipe, request); // Reuse existing utility
	}

	@Override
	@Transactional
	public void deleteRecipe(Long id, String username) {
		Recipe recipe = recipeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(RECIPE, ID, id));

		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));

		boolean isAuthor = recipe.getAuthor().getUsername().equals(username);
		boolean isModeratorOrAdmin = user.getRoles().stream()
				.anyMatch(r -> r.equals(ROLE_ADMIN));

		if (!isAuthor && !isModeratorOrAdmin) {
			throw new org.springframework.security.access.AccessDeniedException("You are not authorized to delete this recipe");
		}

		// Cascade delete related entities
		likeRepository.deleteByRecipe(recipe);
		commentRepository.deleteByRecipe(recipe);
		bookmarkRepository.deleteByRecipe(recipe);
		ratingRepository.deleteByRecipe(recipe);
		notificationRepository.deleteByRecipeId(recipe.getId());
		mealPlanRepository.deleteByRecipe(recipe);
		shoppingListItemRepository.deleteByRecipe(recipe);

		recipeRepository.delete(recipe);
	}

	@Override
	@Transactional(readOnly = true)
	public List<RecipeResponse> getTrendingRecipes(String currentUsername, int limit) {
		Pageable pageable = PageRequest.of(0, limit);
		return recipeRepository.findTrending(pageable).stream().map(r -> this.mapToResponse(r, currentUsername))
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<RecipeResponse> getRecipesByCategory(String categoryName, String currentUsername, int limit) {
		try {
			Category cat = categoryRepository.findByNameIgnoreCase(categoryName)
					.orElseThrow(() -> new ResourceNotFoundException("Category", "name", categoryName));
			Pageable pageable = PageRequest.of(0, limit);
			return recipeRepository.findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(cat, pageable).stream()
					.map(r -> this.mapToResponse(r, currentUsername)).toList();
		} catch (ResourceNotFoundException e) {
			return List.of(); // Return empty list for unknown category
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> getExploreFeedCursorByCategory(String categoryName, LocalDateTime cursor, int size,
			String currentUsername) {
		try {
			Category cat = categoryRepository.findByNameIgnoreCase(categoryName)
					.orElseThrow(() -> new ResourceNotFoundException("Category", "name", categoryName));
			Pageable limit = PageRequest.of(0, size);
			List<Recipe> recipes;

			if (cursor == null) {
				recipes = recipeRepository.findByCategoryAndIsPublishedTrueOrderByCreatedAtDesc(cat, limit);
			} else {
				recipes = recipeRepository.findExploreCursorWithCategoryPublished(cat, cursor, limit);
			}

			List<RecipeResponse> content = recipes.stream().map(r -> this.mapToResponse(r, currentUsername))
					.toList();

			String nextCursor = content.isEmpty() ? "" : content.get(content.size() - 1).getCreatedAt().toString();

			return Map.of(CONTENT, content, NEXT_CURSOR, nextCursor);
		} catch (ResourceNotFoundException e) {
			return Map.of(CONTENT, List.of(), NEXT_CURSOR, "");
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Map<String, Object> getFilteredExploreFeed(LocalDateTime cursor, int size, String category, Integer maxTime,
			Integer maxCalories, String sort, String currentUsername) {
		try {
			Specification<Recipe> spec = (root, query, cb) -> {
				List<Predicate> predicates = new ArrayList<>();
				applyBaseFilters(predicates, root, cb, cursor, category, maxTime, maxCalories);
				applySorting(query, root, cb, sort);
				return cb.and(predicates.toArray(new Predicate[0]));
			};

			Pageable limit = PageRequest.of(0, size);
			List<Recipe> recipes = recipeRepository.findAll(spec, limit).getContent();

			List<RecipeResponse> contentList = recipes.stream().map(r -> this.mapToResponse(r, currentUsername))
					.toList();

			String nextCursorStr = contentList.isEmpty() ? "" : contentList.get(contentList.size() - 1).getCreatedAt().toString();

			return Map.of(CONTENT, contentList, NEXT_CURSOR, nextCursorStr);
		} catch (Exception e) {
			log.error("ERROR in getFilteredExploreFeed: {}", e.getMessage());
			return Map.of(CONTENT, List.of(), NEXT_CURSOR, "", "error", e.getMessage());
		}
	}

	private void applyBaseFilters(List<Predicate> predicates, Root<Recipe> root, CriteriaBuilder cb,
			LocalDateTime cursor, String category, Integer maxTime, Integer maxCalories) {
		predicates.add(cb.isTrue(root.get("isPublished")));

		if (cursor != null) {
			predicates.add(cb.lessThan(root.get(CREATED_AT), cursor));
		}

		if (category != null && !category.isEmpty() && !"all".equalsIgnoreCase(category)) {
			Category cat = categoryRepository.findByNameIgnoreCase(category.trim()).orElse(null);
			if (cat != null) {
				predicates.add(cb.equal(root.get("category"), cat));
			}
		}

		if (maxTime != null) {
			Expression<Integer> prep = cb.coalesce(root.get("prepTimeMinutes"), 0);
			Expression<Integer> cook = cb.coalesce(root.get("cookTimeMinutes"), 0);
			predicates.add(cb.lessThanOrEqualTo(cb.sum(prep, cook), maxTime));
		}

		if (maxCalories != null) {
			predicates.add(cb.lessThanOrEqualTo(cb.coalesce(root.get("calories"), 0), maxCalories));
		}
	}

	private void applySorting(CriteriaQuery<?> query, Root<Recipe> root, CriteriaBuilder cb, String sort) {
		if (isSortableQuery(query)) {
			List<Order> orders = new ArrayList<>();
			addRequestedSortOrders(orders, root, cb, sort);
			addDefaultSortOrderIfEmpty(orders, root, cb);
			query.orderBy(orders);
		}
	}

	private boolean isSortableQuery(CriteriaQuery<?> query) {
		return query != null && query.getResultType() != Long.class && query.getResultType() != long.class;
	}

	private void addRequestedSortOrders(List<Order> orders, Root<Recipe> root, CriteriaBuilder cb, String sort) {
		if (sort != null && !sort.isEmpty()) {
			java.util.Set<String> sortSet = new java.util.HashSet<>(java.util.Arrays.asList(sort.split(",")));
			if (sortSet.contains("rating")) {
				orders.add(cb.desc(cb.coalesce(root.get("averageRating"), 0.0)));
			}
			if (sortSet.contains("trending")) {
				Expression<Integer> likes = cb.coalesce(root.get(LIKE_COUNT_KEY), 0);
				Expression<Integer> ratingsCount = cb.coalesce(root.get("ratingCount"), 0);
				orders.add(cb.desc(cb.sum(likes, ratingsCount)));
			}
			if (sortSet.contains("newest")) {
				orders.add(cb.desc(root.get(CREATED_AT)));
			}
		}
	}

	private void addDefaultSortOrderIfEmpty(List<Order> orders, Root<Recipe> root, CriteriaBuilder cb) {
		if (orders.isEmpty()) {
			orders.add(cb.desc(root.get(CREATED_AT)));
		}
	}
	@Override
	public Recipe getRecipeEntity(Long id) {
		return recipeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(RECIPE, ID, id));
	}

	@Override
	@Transactional
	public Map<String, Object> toggleLike(Long id, String username) {
		User user = userRepository.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException(USER, USERNAME, username));
		Recipe recipe = recipeRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException(RECIPE, ID, id));

		likeRepository.toggleLikeAtomic(user.getId(), recipe.getId());
		boolean isLiked = likeRepository.existsByUserAndRecipe(user, recipe);

		if (isLiked) {
			recipeRepository.incrementLikeCount(id);
			// Send Notification
			notificationService.createAndSendNotification(
					recipe.getAuthor(),
					user,
					com.bluepal.entity.NotificationType.LIKE,
					recipe.getId(),
					user.getUsername() + " liked your recipe: " + recipe.getTitle());
			// Award reputation points to recipe author
			userService.updateReputation(recipe.getAuthor().getUsername(), 5);
			return Map.of("liked", true, LIKE_COUNT_KEY, recipe.getLikeCount() + 1);
		} else {
			recipeRepository.decrementLikeCount(id);
			return Map.of("liked", false, LIKE_COUNT_KEY, Math.max(0, recipe.getLikeCount() - 1));
		}
	}
}