"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/media/Avatar";
import { SectionCard } from "@/components/ui/display/SectionCard";
import { SectionHeader } from "@/components/ui/display/SectionHeader";
import { TextInput } from "@/components/ui/inputs/TextInput";
import { SelectInput } from "@/components/ui/inputs/SelectInput";
import { TextArea } from "@/components/ui/inputs/TextArea";
import { ToggleSwitch } from "@/components/ui/selection/ToggleSwitch";
import { PrimaryButton } from "@/components/ui/buttons/PrimaryButton";

const locationData: Record<string, any> = {
  tr: {
    label: "Turkey",
    cities: {
      istanbul: {
        label: "Istanbul",
        districts: {
          kadikoy: {
            label: "Kadıköy",
            neighborhoods: [
              { label: "Bostancı", value: "bostanci" },
              { label: "Erenköy", value: "erenkoy" },
            ],
          },
          besiktas: {
            label: "Beşiktaş",
            neighborhoods: [
              { label: "Balmumcu", value: "balmumcu" },
              { label: "Kuruçeşme", value: "kurucesme" },
            ],
          },
        },
      },
      ankara: {
        label: "Ankara",
        districts: {
          cankaya: {
            label: "Çankaya",
            neighborhoods: [
              { label: "Anıttepe", value: "anittepe" },
            ],
          },
        },
      },
    },
  },
};

export default function ProfileView() {
  const [profile, setProfile] = React.useState<any>(null);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number>(0);

  React.useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setProfile(JSON.parse(stored));
  }, []);

  if (!profile) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  const handleSave = () => {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");

    localStorage.setItem(
    "user",
    JSON.stringify({
        ...existing,
        ...profile,
    })
    );
  };

  // MULTI FILE UPLOAD
  const handleFileUpload = (field: string, file: File) => {
  setUploading(field);
  setProgress(100);

  const reader = new FileReader();

  reader.onload = () => {
    setProfile((prev: any) => {
      const existing = prev[field] || [];

      return {
        ...prev,
        [field]: [
          ...existing,
          {
            data: reader.result,
            name: file.name,
          },
        ],
        [`${field.replace("Files", "")}Verified`]: false,
      };
    });

    setUploading(null);
  };

  reader.readAsDataURL(file);
};

  const removeFile = (field: string, index: number) => {
    setProfile((prev: any) => {
      const updated = [...(prev[field] || [])];
      updated.splice(index, 1);

      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  // location logic
  const countryData = locationData[profile.country];

  const countryOptions = Object.entries(locationData).map(
    ([key, val]: any) => ({
      label: val.label,
      value: key,
    })
  );

  const cityOptions =
    profile.country &&
    Object.entries(countryData?.cities || {}).map(
      ([key, val]: any) => ({
        label: val.label,
        value: key,
      })
    );

  const districtOptions =
    profile.city &&
    Object.entries(
      countryData?.cities?.[profile.city]?.districts || {}
    ).map(([key, val]: any) => ({
      label: val.label,
      value: key,
    }));

  const neighborhoodOptions =
    profile.district &&
    countryData?.cities?.[profile.city]?.districts?.[
      profile.district
    ]?.neighborhoods || [];

  return (
    <div className="flex gap-10">

      {/* LEFT */}
      <div className="w-64 flex flex-col items-center gap-4">
        <Avatar size="lg" />

        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {profile.fullName || "User"}
          </h2>
          <p className="text-sm text-gray-500">
            {profile.email || "No email"}
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex flex-col gap-6">

        {/* ACCOUNT */}
        <SectionCard>
            <SectionHeader title="Account Information" />
            
        <p className="text-xs text-gray-400 mb-3">
            Your contact details are used for account access and emergency communication.
        </p>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span>{profile.email || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span>{profile.phone || "-"}</span>
            </div>
          </div>
        </SectionCard>

        {/* PHYSICAL */}
        <SectionCard>
            <SectionHeader title="Physical Information" />
        <p className="text-xs text-gray-400 mb-3">
            This information helps responders assess your physical condition in emergencies.
        </p>
          <div className="grid grid-cols-2 gap-4">

            <TextInput
              id="height"
              label="Height (cm)"
              value={profile.height || ""}
              onChange={(e) =>
                setProfile({ ...profile, height: e.target.value })
              }
            />

            <TextInput
              id="weight"
              label="Weight (kg)"
              value={profile.weight || ""}
              onChange={(e) =>
                setProfile({ ...profile, weight: e.target.value })
              }
            />

            <SelectInput
              id="gender"
              label="Gender"
              value={profile.gender || ""}
              onChange={(e) =>
                setProfile({ ...profile, gender: e.target.value })
              }
              options={[
                { label: "Select", value: "" },
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
            />

            <TextInput
              id="birthDate"
              label="Date of Birth"
              type="date"
              value={profile.birthDate || ""}
              onChange={(e) =>
                setProfile({ ...profile, birthDate: e.target.value })
              }
            />

          </div>
        </SectionCard>

        {/* MEDICAL */}
        <SectionCard>
            <SectionHeader title="Medical Information" />
        <p className="text-xs text-gray-400 mb-3">
            In emergency situations, this information may help responders make faster and safer medical decisions.
        </p>

          <TextArea
            id="medicalHistory"
            label="Medical History"
            value={profile.medicalHistory || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                medicalHistory: e.target.value,
              })
            }
          />

          {/* CHRONIC */}
          
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="whitespace-nowrap">
                Chronic Diseases
                </span>
              

              <div className="flex gap-2 text-xs">

                <p className="text-xs text-gray-400 ml-20">
            If you declare a chronic condition, you must upload a supporting medical document (e.g., prescription, medical report, or diagnosis).
            </p>

                <input
                  type="file"
                  id="chronic-upload"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileUpload("chronicDiseasesFiles", e.target.files[0])
                  }
                />

                <label htmlFor="chronic-upload" className="cursor-pointer text-blue-600">
                  Upload
                </label>
              </div>
            </div>

            <TextInput
              id="chronic"
              value={profile.chronicDiseases || ""}
              onChange={(e) =>
                setProfile({ ...profile, chronicDiseases: e.target.value })
              }
            />

            {uploading === "chronicDiseasesFiles" && (
              <div className="mt-2 text-xs">
                Uploading... {progress}%
              </div>
            )}

            {profile.chronicDiseasesFiles?.map((file: any, index: number) => (
              <div key={index} className="mt-2 flex justify-between text-xs text-gray-600">
                <div className="flex flex-col">
                <span>📄 {file.name}</span>

                <span className="text-xs mt-1">
                    {profile.chronicDiseasesVerified ? (
                    <span className="text-green-600">Verified</span>
                    ) : (
                    <span className="text-red-500">Pending Verification</span>
                    )}
                </span>
                </div>
                <button
                  onClick={() => removeFile("chronicDiseasesFiles", index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* ALLERGIES */}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span>Allergies</span>

              <div className="flex gap-2 text-xs">

                <p className="text-xs text-gray-400 mb-2">
                You may optionally add allergies. Verification is not required but recommended.
                </p>

                <input
                  type="file"
                  id="allergy-upload"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleFileUpload("allergiesFiles", e.target.files[0])
                  }
                />

                <label htmlFor="allergy-upload" className="cursor-pointer text-blue-600">
                  Upload
                </label>
              </div>
            </div>

            <TextInput
              id="allergy"
              value={profile.allergies || ""}
              onChange={(e) =>
                setProfile({ ...profile, allergies: e.target.value })
              }
            />

            {uploading === "allergiesFiles" && (
              <div className="mt-2 text-xs">
                Uploading... {progress}%
              </div>
            )}

            {profile.allergiesFiles?.map((file: any, index: number) => (
              <div key={index} className="mt-2 flex justify-between text-xs text-gray-600">
                <div className="flex flex-col">
                <span>📄 {file.name}</span>

                <span className="text-xs mt-1">
                    {profile.chronicDiseasesVerified ? (
                    <span className="text-green-600">Verified</span>
                    ) : (
                    <span className="text-red-500">Pending Verification</span>
                    )}
                </span>
                </div>
                <button
                  onClick={() => removeFile("allergiesFiles", index)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

        </SectionCard>

        {/* LOCATION */}
        <SectionCard>
            <SectionHeader title="Location" />
  <p className="text-xs text-gray-400 mb-3">
    Your location may help emergency services reach you faster.
  </p>

          <div className="grid grid-cols-2 gap-4">
            

            <SelectInput
              id="country"
              label="Country"
              value={profile.country || ""}
              options={[
                { label: "Select Country", value: "" },
                ...countryOptions,
              ]}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  country: e.target.value,
                  city: "",
                  district: "",
                  neighborhood: "",
                })
              }
            />

            <SelectInput
              id="city"
              label="City"
              value={profile.city || ""}
              options={[
                { label: "Select City", value: "" },
                ...(cityOptions || []),
              ]}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  city: e.target.value,
                  district: "",
                  neighborhood: "",
                })
              }
            />

            <SelectInput
              id="district"
              label="District"
              value={profile.district || ""}
              options={[
                { label: "Select District", value: "" },
                ...(districtOptions || []),
              ]}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  district: e.target.value,
                  neighborhood: "",
                })
              }
            />

            <SelectInput
              id="neighborhood"
              label="Neighborhood"
              value={profile.neighborhood || ""}
              options={[
                { label: "Select Neighborhood", value: "" },
                ...(neighborhoodOptions || []),
              ]}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  neighborhood: e.target.value,
                })
              }
            />
            <TextInput
                id="extraAddress"
                label="Extra Address"
                value={profile.extraAddress || ""}
                onChange={(e) =>
                    setProfile({
                    ...profile,
                    extraAddress: e.target.value,
                    })
                }
                />

          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">Share Current Location</span>

            <ToggleSwitch
              checked={profile.shareLocation || false}
              onCheckedChange={(val) =>
                setProfile({ ...profile, shareLocation: val })
              }
            />
          </div>

        </SectionCard>

        {/* SAVE */}
        <div className="flex justify-end">
          <PrimaryButton onClick={handleSave}>
            Save Changes
          </PrimaryButton>
        </div>

      </div>
    </div>
  );
}
