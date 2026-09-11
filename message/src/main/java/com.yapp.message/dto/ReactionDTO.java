package com.yapp.message.dto;

import com.yapp.message.model.ReactionType;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReactionDTO {
    private Long messageId;

    private ReactionType reactionType;

    private Long userId;
}
