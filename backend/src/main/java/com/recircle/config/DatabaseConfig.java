package com.recircle.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Provides a DataSource that works in two environments:
 *
 *  1. Local dev: reads SPRING_DATASOURCE_URL (or defaults to localhost:5432/recircle_db)
 *  2. Render / Heroku: parses DATABASE_URL which uses the postgres:// scheme
 *
 * Render's DATABASE_URL looks like:
 *   postgres://user:password@host:port/dbname
 * which is not a valid JDBC URL, so we convert it here.
 */
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");

        if (databaseUrl == null || databaseUrl.isBlank()) {
            // Local / explicit JDBC URL path
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
            cfg.setPoolName("RecirclePool");
            return new HikariDataSource(cfg);
        }

        // Render / Heroku path — parse postgres://user:pass@host:port/db
        try {
            URI uri = new URI(databaseUrl);

            String userInfo = uri.getUserInfo();
            String[] userPass = userInfo != null
                ? userInfo.split(":", 2)
                : new String[]{"", ""};
            String user = userInfo != null ? userPass[0] : "";
            String pass = userPass.length > 1 ? userPass[1] : "";

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath();
            String dbName = path != null && path.length() > 1
                ? path.substring(1)
                : "";

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
