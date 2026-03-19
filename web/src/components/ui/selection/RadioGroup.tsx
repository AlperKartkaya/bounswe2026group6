"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type RadioOption = {
    label: string;
    value: string;
};

type RadioGroupProps = {
    label?: string;
    name: string;
    value: string;
    options: RadioOption[];
    onValueChange: (value: string) => void;
    direction?: "row" | "column";
};

export function RadioGroup({
    label,
    name,
    value,
    options,
    onValueChange,
    direction = "row",
}: RadioGroupProps) {
    return (
        <div className="flex flex-col gap-2">
            {label ? (
                <span className="text-sm font-medium text-[#2B2B33]">{label}</span>
            ) : null}

            <div
                className={cn(
                    "flex gap-4",
                    direction === "column" ? "flex-col" : "flex-row flex-wrap"
                )}
            >
                {options.map((option) => (
                    <label
                        key={option.value}
                        className="flex items-center gap-2 text-sm text-[#2B2B33]"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onValueChange(option.value)}
                            className="h-4 w-4 accent-[#D84A4A]"
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}