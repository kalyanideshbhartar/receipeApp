import { useState } from 'react';
import { 
  Box, Stepper, Step, StepLabel, Button, 
  Typography, TextField, IconButton, 
  CircularProgress, Alert, Grid, MenuItem,
  FormControlLabel, Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { recipeService } from '../../services/recipe.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const steps = ['General Info', 'Ingredients', 'Cooking Steps'];

interface RecipeFormValues {
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  imageUrl: string;
  additionalImages: string[];
  ingredients: { name: string; quantity: string; unit: string }[];
  steps: { stepNumber: number; instruction: string }[];
  category: string;
  isPublished: boolean;
  isPremium: boolean;
}

interface CreateRecipeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateRecipeForm: React.FC<CreateRecipeFormProps> = ({ onSuccess, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RecipeFormValues>({
    defaultValues: {
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      steps: [{ stepNumber: 1, instruction: '' }],
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      servings: 4,
      imageUrl: '',
      additionalImages: [],
      category: 'Vegetarian',
      isPublished: true,
      isPremium: false
    }
  });

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
    try {
      setError(null);
      setIsSubmitting(true);
      await recipeService.createRecipe(data);
      toast.success('Culinary masterpiece shared with the world!');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: string | { message?: string; error?: string } }; message?: string };
      const responseData = error.response?.data;
      const errorMessage = (typeof responseData === 'object' ? (responseData?.message || responseData?.error) : responseData) || error.message || 'Failed to create recipe';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                  <MenuItem value="Non-Vegetarian">Non-Vegetarian</MenuItem>
                  <MenuItem value="Breakfast">Breakfast</MenuItem>
                  <MenuItem value="Baking">Baking</MenuItem>
                  <MenuItem value="Seafood">Seafood</MenuItem>
                  <MenuItem value="Healthy">Healthy</MenuItem>
                  <MenuItem value="Italian">Italian</MenuItem>
                  <MenuItem value="Dessert">Dessert</MenuItem>
                  <MenuItem value="Snack">Snack</MenuItem>
                  <MenuItem value="Drink">Drink</MenuItem>
                </TextField>
              )}
            />
            <TextField
              size="small"
              fullWidth multiline rows={3} label="The Story" placeholder="What's the inspiration behind this recipe?"
              {...register('description')}
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
                <label htmlFor="modal-image-upload" style={{ cursor: 'pointer' }}>
                  <input
                    accept="image/*" id="modal-image-upload" type="file" multiple
                    style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, false)}
                  />
                  <Box sx={{ py: 2 }}>
                    <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Upload Cover Photo</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      You can select multiple photos at once
                    </Typography>
                    <Button variant="contained" component="span" size="small" disabled={uploading} sx={{ mt: 1, borderRadius: 3 }}>
                      {uploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Choose Image'}
                    </Button>
                  </Box>
                </label>
              )}
            </Box>

            {/* Additional Images Section */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Additional Photos</Typography>
                <label htmlFor="additional-image-upload" style={{ cursor: 'pointer' }}>
                  <input
                    accept="image/*" id="additional-image-upload" type="file" multiple
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 300, overflowY: 'auto', pr: 1 }}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 300, overflowY: 'auto', pr: 1 }}>
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
    <Box sx={{ p: 1 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          {activeStep === 0 ? (
            <Button onClick={onCancel} variant="text" color="inherit">Cancel</Button>
          ) : (
            <Button onClick={handleBack} variant="outlined">Back</Button>
          )}
          
          {activeStep === steps.length - 1 ? (
            <>
              <Button 
                variant="outlined" 
                color="primary" 
                disabled={isSubmitting} 
                size="small" 
                sx={{ borderRadius: 1.5 }}
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
                size="small" 
                sx={{ borderRadius: 1.5 }}
                onClick={() => setValue('isPublished', true)}
              >
                {isSubmitting ? <CircularProgress size={20} /> : 'Post Recipe'}
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={handleNext} size="small" sx={{ borderRadius: 1.5 }}>Next</Button>
          )}
        </Box>
      </form>
    </Box>
  );
};

export default CreateRecipeForm;
