import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";

import { Formik } from "formik";
import { Link } from "react-router-dom";
import { LoginFormValidationSchema } from "@utils/validation";
import useAuthentication from "@hooks/useAuthentication";

const Login = () => {
  const { handleLogin, loginLoading } = useAuthentication();

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          textAlign: "center",
          color: "var(--color-light)",
          mb: 4,
        }}
      >
        Login
      </Typography>
      {/* <Box component={"label"}>Email</Box> */}
      <Formik
        initialValues={{ identifier: "", password: "" }}
        validationSchema={LoginFormValidationSchema}
        onSubmit={(values, { setSubmitting }) => {
          handleLogin(values.identifier, values.password);
          setSubmitting(false);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
        }) => (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Box sx={{ width: "100%" }}>
                <StyledTextField
                  id="identifier"
                  label="Email or Username"
                  variant="outlined"
                  placeholder="Email or Username"
                  autoComplete="username"
                  value={values.identifier}
                  name="identifier"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.identifier && errors.identifier ? true : false}
                />
                {touched.identifier && errors.identifier && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "12px",
                      mt: "3px",
                      ml: "5px",
                      fontWeight: "500",
                      color: "red",
                    }}
                  >
                    {errors.identifier}
                  </Typography>
                )}
              </Box>
              <Box sx={{ width: "100%" }}>
                <StyledTextField
                  id="password"
                  label="Password"
                  autoComplete="password"
                  type="password"
                  variant="outlined"
                  placeholder="Enter Password"
                  value={values.password}
                  name="password"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && errors.password ? true : false}
                />
                {touched.password && errors.password && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "12px",
                      mt: "3px",
                      ml: "5px",
                      fontWeight: "500",
                      color: "red",
                    }}
                  >
                    {errors.password}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit"
                disabled={isSubmitting || loginLoading}
                sx={{
                  color: "#fff",
                  backgroundColor: "#000",
                  ":disabled": {
                    backgroundColor: "#181c14",
                    color: "#fff",
                  },
                }}
              >
                {isSubmitting || loginLoading ? "logging in ..." : "Login"}
              </Button>
            </Stack>
            <Box sx={{ mt: 1 }}>
              <Box>
                <Typography component="span">Create a new account ?</Typography>
                <Link to="/auth/register" className="text-blue-500 ml-2">
                  Register
                </Link>
              </Box>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default Login;

const StyledTextField = styled(TextField)({
  accentColor: "red",
  caretColor: "#fff",
  width: "100%",
  // overflow: "hidden",
  "& .MuiOutlinedInput-root": {
    // backgroundColor: "var(--color-accent-primary)",

    "& fieldset": {
      borderColor: "#fff",
      colors: "#fff",
    },
    "&:hover fieldset": {
      borderColor: "#fff",
      color: "#fff",
    },
    "& .Mui-focused fieldset": {
      borderColor: "red",
      color: "#fff",
    },
    "& input": {
      // backgroundColor: "#fff",
      color: "#fff",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#fff",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#fff",
  },
});
