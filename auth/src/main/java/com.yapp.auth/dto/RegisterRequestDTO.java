package com.yapp.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequestDTO {

    @NotBlank(message = "Name is required field")
    private String name;
    @NotBlank(message = "Surname is required field")
    private String surname;

    @Email
    @NotBlank(message = "Email is required field")
    private String email;

    @NotBlank(message = "Username is required field")
    private String username;

    @Size(min = 6, message = "Password is too short (min 6 character)")
    @NotBlank
    private String password;
}
