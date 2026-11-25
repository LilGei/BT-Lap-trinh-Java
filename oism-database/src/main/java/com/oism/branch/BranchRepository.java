package com.oism.branch;

import com.oism.common.BusinessException;
import com.oism.common.EntityLookup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BranchRepository extends JpaRepository<Branch, UUID> {
    boolean existsByCodeIgnoreCase(String code);

    default Branch requireActive(UUID id) {
        Branch b = EntityLookup.require(this, id, "Branch");
        if (!b.isActive()) throw BusinessException.conflict("Branch is inactive");
        return b;
    }
}
