import * as React from "react";
import { cn } from "@/lib/cn";

type Option = {
    label: string;
    value: string;
};

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    options: Option[];
    placeholder?: string;
};

export function SelectInput({
    label,
    error,
    options,
    className,
    id,
    placeholder = "Select an option",
    ...props
}: SelectInputProps) {
    return (
        <div className="flex w-full flex-col gap-2">
            {label ? (
                <label htmlFor={id} className="text-sm font-medium text-[#2B2B33]">
                    {label}
                </label>
            ) : null}

            <select
                id={id}
                className={cn(
                    "h-11 w-full rounded-[10px] border bg-white px-3 text-sm text-[#2B2B33]",
                    "border-[#E7E7EA] outline-none transition-colors focus:border-[#D84A4A]",
                    error && "border-[#D84A4A]",
                    className
                )}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error ? <p className="text-xs text-[#D84A4A]">{error}</p> : null}
        </div>
    );
}