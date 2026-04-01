package com.jk.miniproject.RideFair.repository;

import com.jk.miniproject.RideFair.entity.FriendGroup;
import com.jk.miniproject.RideFair.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FriendGroupRepository extends JpaRepository<FriendGroup, Long> {

    List<FriendGroup> findByMembersContaining(User user);
}
