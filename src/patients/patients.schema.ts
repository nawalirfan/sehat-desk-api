import { z } from 'zod';

// Alphabetic names with hyphens/apostrophes cover real names like "Mary-Jane"
// or "O'Brien" without opening the field up to arbitrary text.
const namePattern = /^[A-Za-z'-]+$/;

const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]);

const nameField = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(namePattern, 'must contain only letters, hyphens, and apostrophes');

const usPhoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(z.string().length(10, 'must be a 10-digit US phone number'));

const dateOfBirthField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a valid date in YYYY-MM-DD format')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'must be a real calendar date')
  .refine((value) => new Date(value) <= new Date(), 'cannot be in the future');

const zipCodeField = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, 'must be a 5-digit or ZIP+4 US zip code');

const stateField = z
  .string()
  .trim()
  .toUpperCase()
  .length(2)
  .refine((value) => US_STATE_CODES.has(value), 'must be a valid US state abbreviation');

export const patientCreateSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  date_of_birth: dateOfBirthField,
  sex: z.enum(['Male', 'Female', 'Other', 'Decline to Answer']),
  phone_number: usPhoneField,
  email: z.string().trim().email().optional(),
  address_line_1: z.string().trim().min(1),
  address_line_2: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).max(100),
  state: stateField,
  zip_code: zipCodeField,
  insurance_provider: z.string().trim().min(1).optional(),
  insurance_member_id: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]+$/, 'must be alphanumeric')
    .optional(),
  preferred_language: z.string().trim().min(1).default('English'),
  emergency_contact_name: z.string().trim().min(1).optional(),
  emergency_contact_phone: usPhoneField.optional(),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export const patientQuerySchema = z.object({
  last_name: z.string().trim().min(1).optional(),
  date_of_birth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone_number: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .optional(),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export type PatientQuery = z.infer<typeof patientQuerySchema>;
