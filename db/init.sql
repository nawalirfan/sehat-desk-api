CREATE TABLE IF NOT EXISTS patients (
  patient_id               TEXT PRIMARY KEY,
  first_name               TEXT NOT NULL CHECK (length(first_name) BETWEEN 1 AND 50),
  last_name                TEXT NOT NULL CHECK (length(last_name) BETWEEN 1 AND 50),
  date_of_birth             TEXT NOT NULL,
  sex                       TEXT NOT NULL CHECK (sex IN ('Male', 'Female', 'Other', 'Decline to Answer')),
  phone_number              TEXT NOT NULL CHECK (length(phone_number) = 10),
  email                     TEXT,
  address_line_1            TEXT NOT NULL,
  address_line_2            TEXT,
  city                      TEXT NOT NULL CHECK (length(city) BETWEEN 1 AND 100),
  state                     TEXT NOT NULL CHECK (length(state) = 2),
  zip_code                  TEXT NOT NULL,
  insurance_provider        TEXT,
  insurance_member_id       TEXT,
  preferred_language        TEXT NOT NULL DEFAULT 'English',
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT CHECK (emergency_contact_phone IS NULL OR length(emergency_contact_phone) = 10),
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at                TEXT
);

CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patients(last_name);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   TEXT PRIMARY KEY,
  patient_id       TEXT NOT NULL REFERENCES patients(patient_id),
  scheduled_for    TEXT NOT NULL,
  provider_name    TEXT NOT NULL,
  reason           TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);

CREATE TABLE IF NOT EXISTS call_transcripts (
  call_id          TEXT PRIMARY KEY,
  patient_id       TEXT REFERENCES patients(patient_id),
  transcript       TEXT NOT NULL,
  summary          TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_transcripts_patient ON call_transcripts(patient_id);

CREATE TABLE IF NOT EXISTS assistant_config (
  id                       INTEGER PRIMARY KEY CHECK (id = 1),
  greeting                 TEXT NOT NULL DEFAULT 'Thanks for calling SehatDesk...',
  voice_id                 TEXT NOT NULL DEFAULT 'elliot',
  max_call_duration_secs   INTEGER NOT NULL DEFAULT 600 CHECK (max_call_duration_secs BETWEEN 60 AND 1800),
  silence_timeout_secs     INTEGER NOT NULL DEFAULT 30 CHECK (silence_timeout_secs BETWEEN 5 AND 120),
  speaking_wait_secs       REAL NOT NULL DEFAULT 2 CHECK (speaking_wait_secs BETWEEN 0.5 AND 5),
  offer_appointments       INTEGER NOT NULL DEFAULT 1 CHECK (offer_appointments IN (0, 1)),
  system_prompt_override   TEXT,
  updated_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO assistant_config (id) VALUES (1);

-- seed data for demonstration purposes
INSERT OR IGNORE INTO patients (
  patient_id, first_name, last_name, date_of_birth, sex, phone_number,
  address_line_1, city, state, zip_code, preferred_language, created_at, updated_at
) VALUES
  (
    '11111111-1111-4111-8111-111111111111', 'Jane', 'Doe', '1985-04-12', 'Female', '5551234567',
    '123 Main St', 'Springfield', 'IL', '62701', 'English',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    '22222222-2222-4222-8222-222222222222', 'John', 'Smith', '1978-11-02', 'Male', '5559876543',
    '456 Oak Ave', 'Austin', 'TX', '73301', 'English',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );
