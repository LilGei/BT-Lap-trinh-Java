package com.oism.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Bảng tra cứu dùng chung (không theo tenant): Owner / Staff / Cashier. Được seed trong V3. */
@Entity @Table(name = "roles")
@Getter @Setter @NoArgsConstructor
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Enumerated(EnumType.STRING) @Column(nullable = false, unique = true) private RoleName name;
}
