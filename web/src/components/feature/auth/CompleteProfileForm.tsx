"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { TextInput } from "@/components/ui/inputs/TextInput";
import { SelectInput } from "@/components/ui/inputs/SelectInput";
import { TextArea } from "@/components/ui/inputs/TextArea";
import { ToggleSwitch } from "@/components/ui/selection/ToggleSwitch";
import { AuthCard } from "@/components/ui/display/AuthCard";

import { ProfileInfoRow } from "../../ui/display/ProfileInfoRow";
import { SaveActionBar } from "../../ui/display/SaveActionBar";

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

export default function CompleteProfileForm() {
  const router = useRouter();

  const [form, setForm] = React.useState({
    gender: "",
    height: "",
    weight: "",
    birthDate: "",
    medicalHistory: "",
    country: "",
    city: "",
    district: "",
    neighborhood: "",
    extraAddress: "",
    shareLocation: false,
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const countryData = locationData[form.country];

  const countryOptions = Object.entries(locationData).map(
    ([key, val]: any) => ({
      label: val.label,
      value: key,
    })
  );

  const cityOptions =
    form.country &&
    Object.entries(countryData?.cities || {}).map(
      ([key, val]: any) => ({
        label: val.label,
        value: key,
      })
    );

  const districtOptions =
    form.city &&
    Object.entries(
      countryData?.cities?.[form.city]?.districts || {}
    ).map(([key, val]: any) => ({
      label: val.label,
      value: key,
    }));

  const neighborhoodOptions =
    form.district &&
    countryData?.cities?.[form.city]?.districts?.[
      form.district
    ]?.neighborhoods || [];

  const handleSave = async () => {
    setError("");

    if (
      !form.height ||
      !form.weight ||
      !form.country ||
      !form.birthDate
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    //  SIGNUP DATA + PROFILE MERGE
    const existingUser = localStorage.getItem("user");

    let finalData = { ...form };

    if (existingUser) {
      const parsed = JSON.parse(existingUser);

      finalData = {
        ...parsed, // email & phone
        ...form,   // profile data
      };
    }

    localStorage.setItem("user", JSON.stringify(finalData));

    setLoading(false);
  };

  return (
    <AuthCard className="w-full max-w-md mx-auto">
      <div className="flex flex-col gap-5">

        {/* HEADER */}
        <div>
          <h2 className="text-xl font-semibold">
            Complete Your Profile
          </h2>
          <p className="text-sm text-[#737380]">
            Fill in your personal information
          </p>
        </div>


        {/* HEIGHT & WEIGHT */}
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            id="height"
            label="Height (cm)"
            value={form.height}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d{0,3}$/.test(val)) {
                setForm({ ...form, height: val });
              }
            }}
          />

          <TextInput
            id="weight"
            label="Weight (kg)"
            value={form.weight}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d{0,3}$/.test(val)) {
                setForm({ ...form, weight: val });
              }
            }}
          />
        </div>

        {/* GENDER */}
        <ProfileInfoRow label="Gender">
          <SelectInput
            id="gender"
            options={[
              { label: "Select Gender", value: "" },
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" },
            ]}
            value={form.gender}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value })
            }
          />
        </ProfileInfoRow>

        {/* DATE */}
        <ProfileInfoRow label="Date of Birth">
          <TextInput
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) =>
              setForm({ ...form, birthDate: e.target.value })
            }
          />
        </ProfileInfoRow>

        {/* MEDICAL */}
        <ProfileInfoRow label="Medical History (optional)">
          <TextArea
            id="medicalHistory"
            placeholder="Chronic diseases & allergies"
            value={form.medicalHistory}
            onChange={(e) =>
              setForm({
                ...form,
                medicalHistory: e.target.value,
              })
            }
          />
          <p className="text-xs text-gray-400">
            You may need to verify this information later
          </p>
        </ProfileInfoRow>

        {/* ADDRESS */}
        <ProfileInfoRow label="Address">
          <SelectInput
            id="country"
            options={[
              { label: "Select Country", value: "" },
              ...countryOptions,
            ]}
            value={form.country}
            onChange={(e) =>
              setForm({
                ...form,
                country: e.target.value,
                city: "",
                district: "",
                neighborhood: "",
              })
            }
          />

          <SelectInput
            id="city"
            options={[
              { label: "Select City", value: "" },
              ...(cityOptions || []),
            ]}
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
                district: "",
                neighborhood: "",
              })
            }
          />

          <SelectInput
            id="district"
            options={[
              { label: "Select District", value: "" },
              ...(districtOptions || []),
            ]}
            value={form.district}
            onChange={(e) =>
              setForm({
                ...form,
                district: e.target.value,
                neighborhood: "",
              })
            }
          />

          <SelectInput
            id="neighborhood"
            options={[
              { label: "Select Neighborhood", value: "" },
              ...(neighborhoodOptions || []),
            ]}
            value={form.neighborhood}
            onChange={(e) =>
              setForm({
                ...form,
                neighborhood: e.target.value,
              })
            }
          />

          <TextInput
            id="extraAddress"
            placeholder="Street, building, etc. (optional)"
            value={form.extraAddress}
            onChange={(e) =>
              setForm({
                ...form,
                extraAddress: e.target.value,
              })
            }
          />
        </ProfileInfoRow>

        {/* TOGGLE */}
        <div className="flex items-center justify-between">
          <span className="text-sm">
            Share Current Location
          </span>

          <ToggleSwitch
            checked={form.shareLocation}
            onCheckedChange={(val) =>
              setForm({ ...form, shareLocation: val })
            }
          />
        </div>

        {/* ERROR */}
        {error && (
          <p className="text-sm text-[#D84A4A]">
            {error}
          </p>
        )}

        {/* SAVE */}
        <SaveActionBar onSave={handleSave} loading={loading} />
      </div>
    </AuthCard>
  );
}