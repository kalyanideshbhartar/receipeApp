package com.bluepal.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DotenvConfig {

    @SuppressWarnings("java:S1118")
    protected DotenvConfig() {
        // Required for CGLIB enhancement
    }

    static {
        Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

        if (dotenv.get("MAIL_USERNAME") == null) {
            dotenv = Dotenv.configure()
                    .directory("../")
                    .ignoreIfMissing()
                    .load();
        }

        dotenv.entries().forEach(entry -> {
            if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
            }
        });
    }
}
