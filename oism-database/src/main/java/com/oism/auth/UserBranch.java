package com.oism.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Quan hệ "works at" giữa User và Branch (nhiều-nhiều). */
@Entity @Table(name = "user_branches")
@Getter @Setter @NoArgsConstructor
public class UserBranch {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "branch_id", nullable = false) private UUID branchId;
}
