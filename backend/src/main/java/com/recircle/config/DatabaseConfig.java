package com.recircle.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

/**
 * Parses Render/Heroku-style DATABASE_URL (postgres://user:pass@host:port/db)
 * into a JDBC URL and provides a HikariCP DataSource.
 *
 * If DATABASE_URL isn't set (local dev), the standard application.properties
 * values are used instead.
 */
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");

        // Fall back to properties-based config when not running on Render
        if (databaseUrl == null || databaseUrl.isBlank()) {
            String jdbcUrl = System.getenv().getOrDefault(
                "SPRING_DATASOURCE_URL",
                "jdbc:postgresql://localhost:5432/recircle_db"
            );
            String user = System.getenv().getOrDefault(
                "SPRING_DATASOURCE_USERNAME", "postgres"
            );
            String pass = System.getenv().getOrDefault(
                "SPRING_DATASOURCE_PASSWORD", "Recircle@2024"
            );

            HikariConfig cfg = new HikariConfig();
            cfg.setJdbcUrl(jdbcUrl);
            cfg.setUsername(user);
            cfg.setPassword(pass);
            cfg.setDriverClassName("org.postgresql.Driver");
            cfg.setMaximumPoolSize(10);
            cfg.setPoolName("RecircleLocalPool");
            return new HikariDataSource(cfg);
        }

        try {
            // Render: postgres://user:pass@host:port/db
            URI uri = new URI(databaseUrl);
            String userInfo = uri.getUserInfo();
            String[] userPass = userInfo != null ? userInfo.split(":", 2) : new String[]{"", ""};
            String user = userPass[0];
            String pass = userPass.length > 1 ? userPass[1] : "";

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath();
            String dbName = path != null && path.length() > 1 ? path.substring(1) : "";

            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + dbName;

            HikariConfig cfg = new HikariConfig();
            cfg.setJdbcUrl(jdbcUrl);
            cfg.setUsername(user);
            cfg.setPassword(pass);
            cfg.setDriverClassName("org.postgresql.Driver");
            cfg.setMaximumPoolSize(10);
            cfg.setPoolName("RecircleRenderPool");
            return new HikariDataSource(cfg);
        } catch (URISyntaxException e) {
            throw new RuntimeException("Invalid DATABASE_URL: " + e.getMessage(), e);
        }
    }
}
