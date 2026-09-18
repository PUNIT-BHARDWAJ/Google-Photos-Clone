package project.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import project.backend.config.DeploymentEnvironmentListener;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(BackendApplication.class);
		// Accepts a hosting provider's postgres:// URL and names any missing
		// configuration in the log, before the first connection is attempted.
		application.addListeners(new DeploymentEnvironmentListener());
		application.run(args);
	}

}
