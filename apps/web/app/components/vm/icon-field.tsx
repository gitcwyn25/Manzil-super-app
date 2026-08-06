import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Icon, type IconName } from "./icons";

/**
 * Form controls with a leading inline-SVG icon: white ground, outline-variant
 * border, 8px radius; focus = primary border + soft glow (the Bootstrap
 * $input-focus-* recipe set in _tokens.scss). IconSelect suppresses
 * Bootstrap's background-image chevron and draws its own so the field never
 * shows a double chevron (_vm-kit.scss).
 *
 * Both spread the native control props, so labels attach the normal way
 * (`<label htmlFor>` + `id`) and names/placeholders/validation flow through.
 */
export function IconField({
  icon,
  className,
  controlClassName,
  ...inputProps
}: {
  icon: IconName;
  /** Extra classes for the wrapping element. */
  className?: string;
  /** Extra classes for the `<input>` itself. */
  controlClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const control = controlClassName
    ? `form-control vm-icon-field__control ${controlClassName}`
    : "form-control vm-icon-field__control";

  return (
    <span className={className ? `vm-icon-field ${className}` : "vm-icon-field"}>
      <Icon className="vm-icon-field__icon" name={icon} size={18} />
      <input className={control} {...inputProps} />
    </span>
  );
}

export function IconSelect({
  icon,
  className,
  controlClassName,
  children,
  ...selectProps
}: {
  icon: IconName;
  className?: string;
  controlClassName?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const control = controlClassName
    ? `form-select vm-icon-field__control vm-icon-field__control--select ${controlClassName}`
    : "form-select vm-icon-field__control vm-icon-field__control--select";

  return (
    <span className={className ? `vm-icon-field ${className}` : "vm-icon-field"}>
      <Icon className="vm-icon-field__icon" name={icon} size={18} />
      <select className={control} {...selectProps}>
        {children}
      </select>
      <Icon className="vm-icon-field__chevron" name="chevron_down" size={18} />
    </span>
  );
}
