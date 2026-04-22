import { useState, useEffect } from 'react';
import { 
  Box, Stepper, Step, StepLabel, Button, 
  Typography, TextField, IconButton, 
  CircularProgress, Alert, Grid, MenuItem,
  Container, Paper, Breadcrumbs, Link,
  FormControlLabel, Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { recipeService } from '../../services/recipe.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const steps = ['General Info', 'Ingredients', 'Cooking Steps'];

interface RecipeFormValues {
  title: string;
  description: string;
  content: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  imageUrl: string;
  additionalImages: string[];
  ingredients: { name: string; quantity: string; unit: string; category?: string }[];
  steps: { stepNumber: number; instruction: string }[];
  category: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  isPublished: boolean;
  isPremium: boolean;
}

const RecipeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: recipe, isLoading: isLoadingRecipe, error: fetchError } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeService.getRecipeById(Number(id)),
    enabled: !!id
  });

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: '',
      content: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      steps: [{ stepNumber: 1, instruction: '' }],
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      servings: 4,
      imageUrl: '',
      additionalImages: [],
      category: 'VEG',
      isPublished: true,
      isPremium: false
    }
  });

  useEffect(() => {
    if (recipe) {
      reset({
        title: recipe.title,
        description: recipe.description,
        content: recipe.content || '',
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        imageUrl: recipe.imageUrl,
        additionalImages: recipe.additionalImages || [],
        ingredients: recipe.ingredients.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category
        })),
        steps: recipe.steps.map(s => ({
          stepNumber: s.stepNumber,
          instruction: s.instruction
        })),
        category: recipe.category || 'VEG',
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fats: recipe.fats,
        isPublished: recipe.isPublished ?? true,
        isPremium: recipe.isPremium ?? false
      });
    }
  }, [recipe, reset]);

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control,
    name: 'ingredients'
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: 'steps'
  });

  const imageUrl = watch('imageUrl');
  const additionalImages = watch('additionalImages') || [];

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isAdditional = false) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { signature, timestamp, apiKey, cloudName } = await recipeService.getCloudinarySignature();
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey || '');
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', 'recipes');
        const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
        return res.data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      if (!isAdditional) {
        setValue('imageUrl', uploadedUrls[0]);
        if (uploadedUrls.length > 1) {
          setValue('additionalImages', [...additionalImages, ...uploadedUrls.slice(1)]);
        }
      } else {
        setValue('additionalImages', [...additionalImages, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Upload failed', err);
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: RecipeFormValues) => {
    if (!id) return;
    try {
      setError(null);
      setIsSubmitting(true);
      await recipeService.updateRecipe(Number(id), data);
      toast.success('Recipe updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate(`/recipes/${id}`);
      navigate(`/recipes/${id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: string | { message?: string; error?: string } }; message?: string };
      const responseData = error.response?.data;
      const errorMessage = (typeof responseData === 'object' ? (responseData?.message || responseData?.error) : responseData) || error.message || 'Failed to update recipe';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingRecipe) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load recipe details. Please try again.</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>Go Back</Button>
      </Container>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              size="small"
              fullWidth label="Recipe Title" placeholder="Give your masterpiece a name"
              {...register('title', { 
                required: 'Title is required',
                minLength: { value: 3, message: 'Title too short' },
                maxLength: { value: 100, message: 'Title too long' }
              })}
              error={!!errors.title} helperText={errors.title?.message}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  select
                  fullWidth
                  label="Category"
                  error={!!errors.category}
                  helperText={errors.category?.message}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                >
                  <MenuItem value="VEG">Vegetarian</MenuItem>
                  <MenuItem value="NON_VEG">Non-Vegetarian</MenuItem>
                  <MenuItem value="BREAKFAST">Breakfast</MenuItem>
                  <MenuItem value="BAKING">Baking</MenuItem>
                  <MenuItem value="SEAFOOD">Seafood</MenuItem>
                  <MenuItem value="HEALTHY">Healthy</MenuItem>
                  <MenuItem value="ITALIAN">Italian</MenuItem>
                  <MenuItem value="DESSERTS">Desserts</MenuItem>
                  <MenuItem value="SNACK">Snack</MenuItem>
                  <MenuItem value="DRINK">Drink</MenuItem>
                </TextField>
              )}
            />
            <TextField
              size="small"
              fullWidth multiline rows={3} label="The Story" placeholder="What's the inspiration behind this recipe?"
              {...register('description')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <TextField
              size="small"
              fullWidth multiline rows={6} label="Full Recipe Content" placeholder="Detailed instructions, tips, and secrets..."
              {...register('content')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            />
            <Controller
              name="isPremium"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch 
                      {...field} 
                      checked={field.value} 
                      onChange={(e) => field.onChange(e.target.checked)}
                      color="warning" 
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      💎 Premium Recipe
                    </Typography>
                  }
                  sx={{ alignSelf: 'flex-start' }}
                />
              )}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                size="small"
                fullWidth type="number" label="Prep (min)"
                {...register('prepTimeMinutes', { 
                  valueAsNumber: true,
                  required: 'Required',
                  min: { value: 0, message: 'Min 0' },
                  max: { value: 1440, message: 'Max 24h' }
                })}
                error={!!errors.prepTimeMinutes}
                helperText={errors.prepTimeMinutes?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              />
              <TextField 
                size="small"
                fullWidth type="number" label="Cook (min)"
                {...register('cookTimeMinutes', { 
                  valueAsNumber: true,
                  required: 'Required',
                  min: { value: 0, message: 'Min 0' },
                  max: { value: 1440, message: 'Max 24h' }
                })}
                error={!!errors.cookTimeMinutes}
                helperText={errors.cookTimeMinutes?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              />
              <TextField 
                size="small"
                fullWidth type="number" label="Servings"
                {...register('servings', { 
                   valueAsNumber: true,
                   required: 'Required',
                   min: { value: 1, message: 'Min 1' },
                   max: { value: 100, message: 'Max 100' }
                })}
                error={!!errors.servings}
                helperText={errors.servings?.message}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
               <TextField size="small" fullWidth type="number" label="Calories" {...register('calories', { valueAsNumber: true })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
               <TextField size="small" fullWidth type="number" label="Protein (g)" {...register('protein', { valueAsNumber: true })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
               <TextField size="small" fullWidth type="number" label="Carbs (g)" {...register('carbs', { valueAsNumber: true })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
               <TextField size="small" fullWidth type="number" label="Fats (g)" {...register('fats', { valueAsNumber: true })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
            </Box>

            <Box 
              sx={{ 
                border: '2px dashed #e2e8f0', p: 2, textAlign: 'center', borderRadius: 2,
                bgcolor: '#f8fafc', transition: 'all 0.3s', '&:hover': { borderColor: 'primary.main', bgcolor: '#fff5f5' }
              }}
            >
              {imageUrl ? (
                <Box sx={{ position: 'relative' }}>
                  <Box component="img" src={imageUrl} sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2 }} />
                  <Button 
                    variant="contained" color="error" size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, borderRadius: 2 }}
                    onClick={() => setValue('imageUrl', '')}
                  >
                    Remove
                  </Button>
                </Box>
              ) : (
                <label htmlFor="edit-image-upload" style={{ cursor: 'pointer' }}>
                  <input
                    accept="image/*" id="edit-image-upload" type="file" multiple
                    style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, false)}
                  />
                  <Box sx={{ py: 2 }}>
                    <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Upload Cover Photo</Typography>
                    <Button variant="contained" component="span" size="small" disabled={uploading} sx={{ mt: 1, borderRadius: 3 }}>
                      {uploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Choose Image'}
                    </Button>
                  </Box>
                </label>
              )}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Additional Photos</Typography>
                <label htmlFor="additional-image-upload-edit" style={{ cursor: 'pointer' }}>
                  <input
                    accept="image/*" id="additional-image-upload-edit" type="file" multiple
                    style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, true)}
                  />
                  <Button variant="outlined" component="span" size="small" disabled={uploading} sx={{ borderRadius: 1.5 }} startIcon={<AddIcon />}>
                    Add More
                  </Button>
                </label>
              </Box>
              
              <Grid container spacing={1}>
                {additionalImages.map((url, index) => (
                  <Grid size={{ xs: 4 }} key={index}>
                    <Box sx={{ position: 'relative', pt: '100%' }}>
                      <Box 
                        component="img" src={url} 
                        sx={{ 
                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                          objectFit: 'cover', borderRadius: 1.5, border: '1px solid #e2e8f0' 
                        }} 
                      />
                      <IconButton 
                        size="small" color="error" 
                        onClick={() => {
                          const newImages = [...additionalImages];
                          newImages.splice(index, 1);
                          setValue('additionalImages', newImages);
                        }}
                        sx={{ 
                          position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.8)',
                          '&:hover': { bgcolor: 'white' }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Ingredients</Typography>
              <Button 
                size="small" startIcon={<AddIcon />} variant="outlined" sx={{ borderRadius: 1.5 }}
                onClick={() => appendIngredient({ name: '', quantity: '', unit: '' })}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 400, overflowY: 'auto', pr: 1 }}>
              {ingredientFields.map((field, index) => (
                <Box key={field.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField size="small" label="Name" sx={{ flex: 3 }} {...register(`ingredients.${index}.name` as const, { required: true })} />
                  <TextField size="small" label="Qty" sx={{ flex: 1 }} {...register(`ingredients.${index}.quantity` as const, { required: true })} />
                  <TextField size="small" label="Unit" sx={{ flex: 1 }} {...register(`ingredients.${index}.unit` as const)} />
                  <IconButton onClick={() => removeIngredient(index)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Steps</Typography>
              <Button 
                size="small" startIcon={<AddIcon />} variant="outlined" sx={{ borderRadius: 1.5 }}
                onClick={() => appendStep({ stepNumber: stepFields.length + 1, instruction: '' })}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflowY: 'auto', pr: 1 }}>
              {stepFields.map((field, index) => (
                <Box key={field.id} sx={{ display: 'flex', gap: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, mt: 1 }}>{index + 1}.</Typography>
                  <TextField fullWidth multiline size="small" label="Instruction" {...register(`steps.${index}.instruction` as const, { required: true })} />
                  <IconButton onClick={() => removeStep(index)} color="error" size="small" sx={{ alignSelf: 'center' }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => navigate('/feed')}
          sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          Feed
        </Link>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => navigate(`/recipes/${id}`)}
          sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
        >
          Recipe Details
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>Edit Recipe</Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: '-0.02em' }}>Edit Recipe</Typography>
            <Typography variant="body2" color="text.secondary">Make adjustments to your masterpiece</Typography>
          </Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate(`/recipes/${id}`)}
            sx={{ borderRadius: 1.5, textTransform: 'none' }}
          >
            Cancel
          </Button>
        </Box>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 5 }}>
            {activeStep !== 0 && (
              <Button onClick={handleBack} variant="outlined" sx={{ borderRadius: 1.5, px: 3 }}>
                Back
              </Button>
            )}
            
            {activeStep === steps.length - 1 ? (
              <>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  disabled={isSubmitting} 
                  sx={{ borderRadius: 1.5, px: 3, fontWeight: 800 }}
                  onClick={() => {
                    setValue('isPublished', false);
                    handleSubmit(onSubmit)();
                  }}
                >
                  Save as Draft
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  disabled={isSubmitting} 
                  sx={{ borderRadius: 1.5, px: 4, py: 1, fontWeight: 800 }}
                  onClick={() => setValue('isPublished', true)}
                >
                  {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Publish Changes'}
                </Button>
              </>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext} 
                sx={{ borderRadius: 1.5, px: 4, py: 1, fontWeight: 800 }}
              >
                Next
              </Button>
            )}
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default RecipeEditPage;
