package com.yapp.auth.service;

import com.yapp.auth.dto.PublicUserResponseDTO;
import com.yapp.auth.dto.SearchUserDTO;
import com.yapp.auth.dto.UserResponseDTO;
import com.yapp.auth.exception.UserNotFoundException;
import com.yapp.auth.model.User;
import com.yapp.auth.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public UserResponseDTO getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("User does not exist"));
        return UserResponseDTO.builder()
                .name(user.getName())
                .surname(user.getSurname())
                .username(user.getUsername())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    public PublicUserResponseDTO getUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("User does not exist"));
        return PublicUserResponseDTO.builder()
                .name(user.getName())
                .surname(user.getSurname())
                .username(user.getUsername())
                .profileImageUrl(user.getProfileImageUrl())
                .build();

    }


    public void setProfileImage(Long userId, String url) {
        User u = userRepository.findById(userId)
                .orElseThrow(()->new UserNotFoundException("User does not exist"));
        u.setProfileImageUrl(url);
        userRepository.save(u);

    }

    public List<SearchUserDTO> searchUser(String query, Long userId) {
        List<SearchUserDTO> searchUserDTOS = new ArrayList<>();
        if(query.trim().length() < 2){
            return searchUserDTOS;
        }

        List<User> users = userRepository.findTop20ByUsernameContainingIgnoreCaseAndUserIdNot(query, userId);



        for(User user : users){
            SearchUserDTO searchUserDTO = SearchUserDTO.builder()
                    .userId(user.getUserId())
                    .username(user.getUsername())
                    .profileImageUrl(user.getProfileImageUrl())
                    .build();

            searchUserDTOS.add(searchUserDTO);
        }

        return searchUserDTOS;
    }
}
