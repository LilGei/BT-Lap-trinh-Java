package com.oism.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserBranchRepository extends JpaRepository<UserBranch, UUID> {
    List<UserBranch> findByUserId(UUID userId);
    List<UserBranch> findByUserIdIn(Collection<UUID> userIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from UserBranch ub where ub.userId = :userId")
    void deleteByUser(@Param("userId") UUID userId);
}
