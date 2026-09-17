package project.backend.exception;

public class ResourceGoneException extends RuntimeException {

    public ResourceGoneException(String message) {
        super(message);
    }
}
