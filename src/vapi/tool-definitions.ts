
export const lookupPatientByPhoneTool = {
  type: 'function' as const,
  function: {
    name: 'lookup_patient_by_phone',
    description:
      'Looks up whether any patient records already exist for a given phone number. Call this right after collecting the phone number, before continuing to collect the rest of the intake fields. This also validates the phone number is exactly 10 digits; if the result includes an error field, the number was the wrong length, apologize and ask the caller for it again before continuing. The result can include more than one match, since a household can share a phone line. Each match includes the patient\'s full stored record (name, DOB, address, etc.), not just their name, use this to read their info back and ask if it is still accurate rather than re-collecting everything from scratch.',
    parameters: {
      type: 'object',
      properties: {
        phone_number: {
          type: 'string',
          description: 'The 10-digit US phone number the caller provided, digits only.',
        },
      },
      required: ['phone_number'],
    },
  },
};

export const createOrUpdatePatientTool = {
  type: 'function' as const,
  function: {
    name: 'create_or_update_patient',
    description:
      'Saves a patient registration. Call this only once, after the caller has heard the full read-back of their information and explicitly confirmed it is correct. If patient_id is provided, this updates an existing record instead of creating a new one.',
    parameters: {
      type: 'object',
      properties: {
        patient_id: {
          type: 'string',
          description: 'If updating an existing patient (from a prior lookup_patient_by_phone match), their patient_id. Omit when creating a new patient.',
        },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        date_of_birth: { type: 'string', description: 'YYYY-MM-DD format.' },
        sex: { type: 'string', enum: ['Male', 'Female', 'Other', 'Decline to Answer'] },
        phone_number: { type: 'string', description: '10-digit US phone number, digits only.' },
        email: { type: 'string' },
        address_line_1: { type: 'string' },
        address_line_2: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string', description: 'Two-letter US state abbreviation.' },
        zip_code: { type: 'string' },
        insurance_provider: { type: 'string' },
        insurance_member_id: { type: 'string' },
        preferred_language: { type: 'string' },
        emergency_contact_name: { type: 'string' },
        emergency_contact_phone: { type: 'string' },
      },
      required: [
        'first_name',
        'last_name',
        'date_of_birth',
        'sex',
        'phone_number',
        'address_line_1',
        'city',
        'state',
        'zip_code',
      ],
    },
  },
};

export const scheduleAppointmentTool = {
  type: 'function' as const,
  function: {
    name: 'schedule_appointment',
    description:
      'Schedules a mock first appointment for a patient who has just completed registration and opted in. Only call this after create_or_update_patient has succeeded and the caller has said yes to scheduling. The result includes a mock provider name to mention to the caller.',
    parameters: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'The patient_id returned by create_or_update_patient.' },
        preferred_time: {
          type: 'string',
          description: 'Optional ISO datetime the caller mentioned as preferred; the nearest available mock slot is chosen if given.',
        },
      },
      required: ['patient_id'],
    },
  },
};

export const vapiToolDefinitions = [
  lookupPatientByPhoneTool,
  createOrUpdatePatientTool,
  scheduleAppointmentTool,
];
