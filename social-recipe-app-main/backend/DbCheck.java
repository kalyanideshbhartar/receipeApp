import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/social_recipe_db";
        String user = "postgres";
        String password = "root";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Checking tables...");
            ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            while (rs.next()) {
                System.out.println("Table: " + rs.getString("table_name"));
            }

            System.out.println("\nChecking Flyway history...");
            rs = stmt.executeQuery("SELECT * FROM flyway_schema_history");
            while (rs.next()) {
                System.out.println("Flyway: " + rs.getString("version") + " - " + rs.getString("success"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
