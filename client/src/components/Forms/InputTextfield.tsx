import {
  Box,
  TextField,
  TextFieldVariants,
  Typography,
  styled,
} from "@mui/material";
import React, { ChangeEvent } from "react";

type InputFieldProps = {
  value: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isTouched: boolean | undefined;
  error: string | undefined;
  variant?: TextFieldVariants | undefined;
  id?: string;
  label?: string;
  placeholder?: string;
  name: string;
  type?: React.HTMLInputTypeAttribute | undefined;
};

const InputTextfield = React.memo(
  ({
    error,
    isTouched,
    handleBlur,
    handleChange,
    value,
    name,
    variant,
    label,
    placeholder,
    id,
    type,
  }: InputFieldProps) => {
    return (
      <Box sx={{ width: "100%", textAlign: "start" }}>
        <StyledTextField
          id={id}
          label={label}
          variant={variant}
          placeholder={placeholder}
          name={name}
          value={value}
          type={type}
          onChange={handleChange}
          onBlur={handleBlur}
          error={error && isTouched ? true : false}
        />
        {isTouched && error && (
          <Typography
            variant="body2"
            sx={{
              fontSize: "12px",
              mt: "3px",
              ml: "5px",
              fontWeight: "500",
              color: "var(--color-danger)",
            }}
          >
            {error}
          </Typography>
        )}
      </Box>
    );
  }
);
InputTextfield.displayName = "InputTextfield";
export default InputTextfield;
const StyledTextField = styled(TextField)({
  accentColor: "var(--color-danger)",
  caretColor: "var(--color-light)",
  width: "100%",
  color: "var(--color-light)",

  "& .MuiInputBase-root": {
    color: "rgba(255,255,255,1)",
  },
  "& .MuiInputBase-root:hover:focus:focus-visible:focus-within": {
    color: "rgba(255,255,255,1)",
  },

  "& .MuiInput-underline:before": {
    borderBottomColor: "rgba(255,255,255,0.6)", // default border color (white with  opacity 0.5)
  },
  "& .MuiInput-underline:hover:before": {
    borderBottomColor: "var(--color-light)", // hover state border color (fully white )
  },
  "& .MuiInput-underline:hover:after": {
    borderBottomColor: "var(--color-light)",
  },
  "& .MuiInput-underline:after": {
    borderBottomColor: "var(--color-bg-primary)", // Focused state border color  when we leave cursor out off input
  },
  "& .Mui-error:after": {
    borderBottomColor: "var(--color-danger)",
  },
  // overflow: "hidden",
  "& .MuiOutlinedInput-root": {
    // backgroundColor: "var(--color-accent-primary)",
    color: "var(--color-light)",
    "& fieldset": {
      borderColor: "var(--color-light)",
      colors: "var(--color-light)",
    },
    "&:hover fieldset": {
      borderColor: "var(--color-light)",
      color: "var(--color-light)",
    },
    "& .Mui-focused fieldset": {
      borderColor: "var(--color-light)",
      color: "var(--color-light)",
    },
    "& input": {
      //   backgroundColor: "var(--color-light)",
      color: "var(--color-light)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "var(--color-bg-primary)",
    fontWeight: 600,
  },
  "& label .Mui-focused": {
    color: "var(--color-light)",
  },
  // "& .MuiInputLabel-root.Mui-focused": {
  //   color: "var(--color-light)",
  // },
});
