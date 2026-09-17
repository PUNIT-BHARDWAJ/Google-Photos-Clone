package project.backend.exception;

public class ImageKitUploadException extends RuntimeException {

    public ImageKitUploadException(String message) {
       super(message);
    }
  
    public ImageKitUploadException(String message,Throwable cause) {
    super(message, cause);
    }
}