package com.oism.purchasing;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity @Table(name = "suppliers")
@Getter @Setter @NoArgsConstructor
public class Supplier extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private String name;
    private String phone;
    private String address;
    @Column(nullable = false) private boolean active = true;
}
