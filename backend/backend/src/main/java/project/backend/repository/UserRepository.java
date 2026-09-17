package project.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import project.backend.domain.User;


public interface UserRepository extends JpaRepository<User,UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
