import { useState } from 'react';
import { useAuth } from '@lernplattform/shared';
import type { Class } from '@lernplattform/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  schoolYear: string;
}

interface FormErrors {
  name?: string;
  schoolYear?: string;
  general?: string;
}

export interface CreateClassFormProps {
  onCreated: (newClass: Class) => void;
  onCancel: () => void;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(values: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) {
    errors.name = 'Bitte Klassenname eingeben';
  }
  if (!values.schoolYear.trim()) {
    errors.schoolYear = 'Bitte Schuljahr eingeben';
  }
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateClassForm({ onCreated, onCancel }: CreateClassFormProps) {
  const { pb, user } = useAuth();

  const [values, setValues] = useState<FormState>({ name: '', schoolYear: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const newClass = await pb.collection('classes').create<Class>({
        name: values.name.trim(),
        school_year: values.schoolYear.trim(),
        is_active: true,
        created_by: user?.id ?? '',
      });
      onCreated(newClass);
    } catch {
      setErrors({ general: 'Klasse konnte nicht erstellt werden. Bitte versuche es erneut.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Neue Klasse erstellen">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Neue Klasse erstellen</h3>

      {errors.general && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="class-name" className="block text-sm font-medium text-gray-700 mb-1">
            Klassenname <span aria-hidden="true">*</span>
          </label>
          <input
            id="class-name"
            type="text"
            value={values.name}
            onChange={handleChange('name')}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'class-name-error' : undefined}
            placeholder="z.B. FI24a"
            className={[
              'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
            ].join(' ')}
          />
          {errors.name && (
            <p id="class-name-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="school-year" className="block text-sm font-medium text-gray-700 mb-1">
            Schuljahr <span aria-hidden="true">*</span>
          </label>
          <input
            id="school-year"
            type="text"
            value={values.schoolYear}
            onChange={handleChange('schoolYear')}
            aria-required="true"
            aria-invalid={!!errors.schoolYear}
            aria-describedby={errors.schoolYear ? 'school-year-error' : undefined}
            placeholder="z.B. 2025/2026"
            className={[
              'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.schoolYear ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
            ].join(' ')}
          />
          {errors.schoolYear && (
            <p id="school-year-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.schoolYear}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Erstelle…' : 'Klasse erstellen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 sm:flex-none px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
