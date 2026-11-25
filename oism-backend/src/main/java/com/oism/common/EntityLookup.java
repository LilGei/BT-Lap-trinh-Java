package com.oism.common;

import org.springframework.data.jpa.repository.JpaRepository;

public final class EntityLookup {
    private EntityLookup() {}

    public static <T, ID> T require(JpaRepository<T, ID> repository, ID id, String label) {
        return repository.findById(id).orElseThrow(() -> BusinessException.notFound(label + " not found"));
    }
}
