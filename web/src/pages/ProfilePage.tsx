import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { useAuth } from '../context/AuthContext'
import {
  ApiError,
  getMyProfile,
  patchHealth,
  patchLocation,
  patchPhysical,
  patchPrivacy,
  patchProfile,
  type ProfileBundle,
} from '../lib/api'

type SectionKey = 'profile' | 'physical' | 'health' | 'location' | 'privacy'

type SectionState = {
  tone: 'success' | 'error' | null
  message: string | null
  isSaving: boolean
}

type SectionStatuses = Record<SectionKey, SectionState>

const initialSectionStatuses: SectionStatuses = {
  profile: { tone: null, message: null, isSaving: false },
  physical: { tone: null, message: null, isSaving: false },
  health: { tone: null, message: null, isSaving: false },
  location: { tone: null, message: null, isSaving: false },
  privacy: { tone: null, message: null, isSaving: false },
}

const visibilityOptions = ['PRIVATE', 'EMERGENCY_ONLY', 'PUBLIC'] as const

function listToText(values: string[]) {
  return values.join(', ')
}

function textToList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function numberOrNull(value: string) {
  if (!value.trim()) {
    return null
  }

  return Number(value)
}

function stringOrNull(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function ProfilePage() {
  const { accessToken, currentUser } = useAuth()
  const [profile, setProfile] = useState<ProfileBundle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [sectionStatuses, setSectionStatuses] = useState(initialSectionStatuses)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [physicalForm, setPhysicalForm] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
  })
  const [healthForm, setHealthForm] = useState({
    medicalConditions: '',
    chronicDiseases: '',
    allergies: '',
    medications: '',
    bloodType: '',
  })
  const [locationForm, setLocationForm] = useState({
    address: '',
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  })
  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: 'PRIVATE',
    healthInfoVisibility: 'PRIVATE',
    locationVisibility: 'PRIVATE',
    locationSharingEnabled: false,
  })

  const applyProfileToForms = useCallback((nextProfile: ProfileBundle) => {
    setProfile(nextProfile)
    setProfileMissing(false)
    setProfileForm({
      firstName: nextProfile.profile.firstName || '',
      lastName: nextProfile.profile.lastName || '',
      phoneNumber: nextProfile.profile.phoneNumber || '',
    })
    setPhysicalForm({
      age: nextProfile.physicalInfo.age?.toString() || '',
      gender: nextProfile.physicalInfo.gender || '',
      height: nextProfile.physicalInfo.height?.toString() || '',
      weight: nextProfile.physicalInfo.weight?.toString() || '',
    })
    setHealthForm({
      medicalConditions: listToText(nextProfile.healthInfo.medicalConditions),
      chronicDiseases: listToText(nextProfile.healthInfo.chronicDiseases),
      allergies: listToText(nextProfile.healthInfo.allergies),
      medications: listToText(nextProfile.healthInfo.medications),
      bloodType: nextProfile.healthInfo.bloodType || '',
    })
    setLocationForm({
      address: nextProfile.locationProfile.address || '',
      city: nextProfile.locationProfile.city || '',
      country: nextProfile.locationProfile.country || '',
      latitude: nextProfile.locationProfile.latitude?.toString() || '',
      longitude: nextProfile.locationProfile.longitude?.toString() || '',
    })
    setPrivacyForm({
      profileVisibility: nextProfile.privacySettings.profileVisibility,
      healthInfoVisibility: nextProfile.privacySettings.healthInfoVisibility,
      locationVisibility: nextProfile.privacySettings.locationVisibility,
      locationSharingEnabled: nextProfile.privacySettings.locationSharingEnabled,
    })
  }, [])

  const updateSectionState = useCallback((section: SectionKey, nextState: Partial<SectionState>) => {
    setSectionStatuses((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...nextState,
      },
    }))
  }, [])

  const loadProfile = useCallback(async () => {
    if (!accessToken) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const data = await getMyProfile(accessToken)
      applyProfileToForms(data)
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setProfile(null)
          setProfileMissing(true)
          setErrorMessage('Your account is ready. Add your profile details to continue.')
        } else {
          setErrorMessage(error instanceof ApiError ? error.message : 'We could not load your profile right now.')
        }
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, applyProfileToForms])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      return
    }

    updateSectionState('profile', { isSaving: true, message: null, tone: null })

    try {
      const updated = await patchProfile(accessToken, {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phoneNumber: stringOrNull(profileForm.phoneNumber),
      })

      applyProfileToForms(updated)
      setErrorMessage(null)
        updateSectionState('profile', {
          isSaving: false,
          tone: 'success',
          message: profileMissing ? 'Profile created.' : 'Profile updated.',
        })
      } catch (error) {
        updateSectionState('profile', {
          isSaving: false,
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'We could not save your profile right now.',
        })
      }
  }

  async function handlePhysicalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      return
    }

    updateSectionState('physical', { isSaving: true, message: null, tone: null })

    try {
      const payload: Record<string, number | string | null> = {}

      if (physicalForm.age.trim()) {
        payload.age = Number(physicalForm.age)
      }

      if (physicalForm.gender.trim()) {
        payload.gender = physicalForm.gender.trim()
      }

      if (physicalForm.height.trim()) {
        payload.height = Number(physicalForm.height)
      }

      if (physicalForm.weight.trim()) {
        payload.weight = Number(physicalForm.weight)
      }

      const updated = await patchPhysical(accessToken, payload)

      applyProfileToForms(updated)
        updateSectionState('physical', {
          isSaving: false,
          tone: 'success',
          message: 'Physical details updated.',
        })
      } catch (error) {
        updateSectionState('physical', {
          isSaving: false,
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'We could not save these details right now.',
        })
      }
  }

  async function handleHealthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      return
    }

    updateSectionState('health', { isSaving: true, message: null, tone: null })

    try {
      const updated = await patchHealth(accessToken, {
        medicalConditions: textToList(healthForm.medicalConditions),
        chronicDiseases: textToList(healthForm.chronicDiseases),
        allergies: textToList(healthForm.allergies),
        medications: textToList(healthForm.medications),
        bloodType: stringOrNull(healthForm.bloodType),
      })

      applyProfileToForms(updated)
      updateSectionState('health', {
        isSaving: false,
        tone: 'success',
        message: 'Health information saved.',
      })
    } catch (error) {
      updateSectionState('health', {
        isSaving: false,
        tone: 'error',
        message: error instanceof ApiError ? error.message : 'Unable to save health information.',
      })
    }
  }

  async function handleLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      return
    }

    const latitudeFilled = locationForm.latitude.trim() !== ''
    const longitudeFilled = locationForm.longitude.trim() !== ''

    if (latitudeFilled !== longitudeFilled) {
      updateSectionState('location', {
        isSaving: false,
        tone: 'error',
        message: 'Latitude and longitude must be provided together.',
      })
      return
    }

    updateSectionState('location', { isSaving: true, message: null, tone: null })

    try {
      const updated = await patchLocation(accessToken, {
        address: stringOrNull(locationForm.address),
        city: stringOrNull(locationForm.city),
        country: stringOrNull(locationForm.country),
        latitude: latitudeFilled ? numberOrNull(locationForm.latitude) : null,
        longitude: longitudeFilled ? numberOrNull(locationForm.longitude) : null,
      })

      applyProfileToForms(updated)
        updateSectionState('location', {
          isSaving: false,
          tone: 'success',
          message: 'Location details updated.',
        })
      } catch (error) {
        updateSectionState('location', {
          isSaving: false,
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'We could not save your location right now.',
        })
      }
  }

  async function handlePrivacySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      return
    }

    updateSectionState('privacy', { isSaving: true, message: null, tone: null })

    try {
      const updated = await patchPrivacy(accessToken, privacyForm)

      applyProfileToForms(updated)
        updateSectionState('privacy', {
          isSaving: false,
          tone: 'success',
          message: 'Privacy settings updated.',
        })
      } catch (error) {
        updateSectionState('privacy', {
          isSaving: false,
          tone: 'error',
          message: error instanceof ApiError ? error.message : 'We could not save your privacy settings right now.',
        })
      }
  }

  return (
    <section className="dashboard-grid dashboard-grid-profile">
      <article className="panel-card">
        <p className="eyebrow">Account</p>
        <h1>Your account</h1>
        <dl className="detail-list">
          <div>
            <dt>Email</dt>
            <dd>{currentUser?.email || 'Unknown'}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{currentUser?.userId || 'Unknown'}</dd>
          </div>
          <div>
            <dt>Email verified</dt>
            <dd>{currentUser?.isEmailVerified ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </article>

      <article className="panel-card panel-card-wide">
        <p className="eyebrow">Profile</p>
        <h2>Edit your profile</h2>

        {isLoading ? <p className="status-copy">Loading profile...</p> : null}
        {!isLoading && errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        {!isLoading ? (
          <div className="editor-grid">
            <form className="editor-card editor-card-wide" onSubmit={handleProfileSubmit}>
              <div className="editor-header">
                <div>
                  <h3>Base profile</h3>
                  <p>Add your basic details first.</p>
                </div>
              </div>

              <label>
                <span>First name</span>
                <input
                  onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                  required
                  type="text"
                  value={profileForm.firstName}
                />
              </label>
              <label>
                <span>Last name</span>
                <input
                  onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                  required
                  type="text"
                  value={profileForm.lastName}
                />
              </label>
              <label>
                <span>Phone number</span>
                <input
                  onChange={(event) => setProfileForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                  type="text"
                  value={profileForm.phoneNumber}
                />
              </label>

              {sectionStatuses.profile.message ? (
                <p className={sectionStatuses.profile.tone === 'error' ? 'form-error' : 'form-success'}>
                  {sectionStatuses.profile.message}
                </p>
              ) : null}

              <button className="primary-button" disabled={sectionStatuses.profile.isSaving} type="submit">
                {sectionStatuses.profile.isSaving ? 'Saving...' : profileMissing ? 'Create profile' : 'Save profile'}
              </button>
            </form>

            {profile ? (
              <>
                <form className="editor-card" onSubmit={handlePhysicalSubmit}>
                  <div className="editor-header">
                    <div>
                      <h3>Physical information</h3>
                      <p>Share the details you want to keep available in an emergency.</p>
                    </div>
                  </div>
                  <label>
                    <span>Age</span>
                    <input
                      onChange={(event) => setPhysicalForm((current) => ({ ...current, age: event.target.value }))}
                      type="number"
                      value={physicalForm.age}
                    />
                  </label>
                  <label>
                    <span>Gender</span>
                    <input
                      onChange={(event) => setPhysicalForm((current) => ({ ...current, gender: event.target.value }))}
                      type="text"
                      value={physicalForm.gender}
                    />
                  </label>
                  <label>
                    <span>Height</span>
                    <input
                      onChange={(event) => setPhysicalForm((current) => ({ ...current, height: event.target.value }))}
                      type="number"
                      value={physicalForm.height}
                    />
                  </label>
                  <label>
                    <span>Weight</span>
                    <input
                      onChange={(event) => setPhysicalForm((current) => ({ ...current, weight: event.target.value }))}
                      type="number"
                      value={physicalForm.weight}
                    />
                  </label>
                  {sectionStatuses.physical.message ? (
                    <p className={sectionStatuses.physical.tone === 'error' ? 'form-error' : 'form-success'}>
                      {sectionStatuses.physical.message}
                    </p>
                  ) : null}
                  <button className="primary-button" disabled={sectionStatuses.physical.isSaving} type="submit">
                      {sectionStatuses.physical.isSaving ? 'Saving...' : 'Save details'}
                  </button>
                </form>

                <form className="editor-card" onSubmit={handleHealthSubmit}>
                  <div className="editor-header">
                    <div>
                      <h3>Health information</h3>
                      <p>Use commas to separate multiple items.</p>
                    </div>
                  </div>
                  <label>
                    <span>Medical conditions</span>
                    <textarea
                      onChange={(event) => setHealthForm((current) => ({ ...current, medicalConditions: event.target.value }))}
                      rows={3}
                      value={healthForm.medicalConditions}
                    />
                  </label>
                  <label>
                    <span>Chronic diseases</span>
                    <textarea
                      onChange={(event) => setHealthForm((current) => ({ ...current, chronicDiseases: event.target.value }))}
                      rows={3}
                      value={healthForm.chronicDiseases}
                    />
                  </label>
                  <label>
                    <span>Allergies</span>
                    <textarea
                      onChange={(event) => setHealthForm((current) => ({ ...current, allergies: event.target.value }))}
                      rows={3}
                      value={healthForm.allergies}
                    />
                  </label>
                  <label>
                    <span>Medications</span>
                    <textarea
                      onChange={(event) => setHealthForm((current) => ({ ...current, medications: event.target.value }))}
                      rows={3}
                      value={healthForm.medications}
                    />
                  </label>
                  <label>
                    <span>Blood type</span>
                    <input
                      onChange={(event) => setHealthForm((current) => ({ ...current, bloodType: event.target.value }))}
                      type="text"
                      value={healthForm.bloodType}
                    />
                  </label>
                  {sectionStatuses.health.message ? (
                    <p className={sectionStatuses.health.tone === 'error' ? 'form-error' : 'form-success'}>
                      {sectionStatuses.health.message}
                    </p>
                  ) : null}
                  <button className="primary-button" disabled={sectionStatuses.health.isSaving} type="submit">
                      {sectionStatuses.health.isSaving ? 'Saving...' : 'Save health details'}
                  </button>
                </form>

                <form className="editor-card" onSubmit={handleLocationSubmit}>
                  <div className="editor-header">
                    <div>
                      <h3>Location information</h3>
                      <p>Enter both coordinates together if you want to save them.</p>
                    </div>
                  </div>
                  <label>
                    <span>Address</span>
                    <input
                      onChange={(event) => setLocationForm((current) => ({ ...current, address: event.target.value }))}
                      type="text"
                      value={locationForm.address}
                    />
                  </label>
                  <label>
                    <span>City</span>
                    <input
                      onChange={(event) => setLocationForm((current) => ({ ...current, city: event.target.value }))}
                      type="text"
                      value={locationForm.city}
                    />
                  </label>
                  <label>
                    <span>Country</span>
                    <input
                      onChange={(event) => setLocationForm((current) => ({ ...current, country: event.target.value }))}
                      type="text"
                      value={locationForm.country}
                    />
                  </label>
                  <label>
                    <span>Latitude</span>
                    <input
                      onChange={(event) => setLocationForm((current) => ({ ...current, latitude: event.target.value }))}
                      type="number"
                      value={locationForm.latitude}
                    />
                  </label>
                  <label>
                    <span>Longitude</span>
                    <input
                      onChange={(event) => setLocationForm((current) => ({ ...current, longitude: event.target.value }))}
                      type="number"
                      value={locationForm.longitude}
                    />
                  </label>
                  {sectionStatuses.location.message ? (
                    <p className={sectionStatuses.location.tone === 'error' ? 'form-error' : 'form-success'}>
                      {sectionStatuses.location.message}
                    </p>
                  ) : null}
                  <button className="primary-button" disabled={sectionStatuses.location.isSaving} type="submit">
                    {sectionStatuses.location.isSaving ? 'Saving...' : 'Save location'}
                  </button>
                </form>

                <form className="editor-card" onSubmit={handlePrivacySubmit}>
                  <div className="editor-header">
                    <div>
                      <h3>Privacy settings</h3>
                      <p>Choose who can see each part of your information.</p>
                    </div>
                  </div>
                  <label>
                    <span>Profile visibility</span>
                    <select
                      onChange={(event) =>
                        setPrivacyForm((current) => ({ ...current, profileVisibility: event.target.value }))
                      }
                      value={privacyForm.profileVisibility}
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Health info visibility</span>
                    <select
                      onChange={(event) =>
                        setPrivacyForm((current) => ({ ...current, healthInfoVisibility: event.target.value }))
                      }
                      value={privacyForm.healthInfoVisibility}
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Location visibility</span>
                    <select
                      onChange={(event) =>
                        setPrivacyForm((current) => ({ ...current, locationVisibility: event.target.value }))
                      }
                      value={privacyForm.locationVisibility}
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkbox-row">
                    <input
                      checked={privacyForm.locationSharingEnabled}
                      onChange={(event) =>
                        setPrivacyForm((current) => ({
                          ...current,
                          locationSharingEnabled: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Allow location sharing during emergencies</span>
                  </label>
                  {sectionStatuses.privacy.message ? (
                    <p className={sectionStatuses.privacy.tone === 'error' ? 'form-error' : 'form-success'}>
                      {sectionStatuses.privacy.message}
                    </p>
                  ) : null}
                  <button className="primary-button" disabled={sectionStatuses.privacy.isSaving} type="submit">
                      {sectionStatuses.privacy.isSaving ? 'Saving...' : 'Save privacy settings'}
                  </button>
                </form>
              </>
            ) : (
              <div className="editor-card editor-card-muted editor-card-wide">
                <h3>Profile not created yet</h3>
                <p>Add your basic profile details first, then you can fill in the rest.</p>
              </div>
            )}
          </div>
        ) : null}
      </article>
    </section>
  )
}
