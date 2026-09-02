package com.recircle.config;

import com.recircle.entity.*;
import com.recircle.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CollectorProfileRepository collectorProfileRepository;

    @Autowired
    private RecyclerRepository recyclerRepository;

    @Autowired
    private MaterialCategoryRepository categoryRepository;

    @Autowired
    private RecyclerOfferRepository offerRepository;

    @Autowired
    private PriceRecordRepository priceRecordRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("🌱 Seeding demo data...");

        // Check if data already exists
        if (userRepository.count() > 0) {
            System.out.println("✅ Data already seeded. Skipping.");
            return;
        }

        // Create Admin
        User admin = createUser("admin@recircle.demo", "Admin@123", "System Admin", "9999999999", User.UserRole.ADMIN);
        System.out.println("✅ Admin created");

        // Create Collectors
        User collector1 = createUser("collector@recircle.demo", "Collector@123", "Ramesh Kumar", "9876543210", User.UserRole.COLLECTOR);
        createCollectorProfile(collector1, "Mumbai, Maharashtra", 19.0760, 72.8777, "Hindi");
        System.out.println("✅ Collector 1 created");

        User collector2 = createUser("priya@recircle.demo", "Collector@123", "Priya Singh", "9876543211", User.UserRole.COLLECTOR);
        createCollectorProfile(collector2, "Pune, Maharashtra", 18.5204, 73.8567, "Marathi");
        System.out.println("✅ Collector 2 created");

        // Create Recyclers
        Recycler recycler1 = createRecycler(
            createUser("recycler@recircle.demo", "Recycler@123", "GreenCycle Pune", "9876543212", User.UserRole.RECYCLER),
            "GreenCycle Solutions", "Pune, Maharashtra", 18.5204, 73.8567,
            "AUTH-001", true, "Rajesh Patel", "9876543212", true, "Pune", 15.0
        );
        System.out.println("✅ Recycler 1 created");

        Recycler recycler2 = createRecycler(
            createUser("ecorecycle@recircle.demo", "Recycler@123", "EcoRecycle Mumbai", "9876543213", User.UserRole.RECYCLER),
            "EcoRecycle Industries", "Mumbai, Maharashtra", 19.0760, 72.8777,
            "AUTH-002", true, "Sneha Sharma", "9876543213", false, "Mumbai", 10.0
        );
        System.out.println("✅ Recycler 2 created");

        // Create more demo recyclers
        Recycler recycler3 = createRecycler(
            createUser("techrecycle@recircle.demo", "Recycler@123", "TechRecycle Bangalore", "9876543214", User.UserRole.RECYCLER),
            "TechRecycle Solutions", "Bangalore, Karnataka", 12.9716, 77.5946,
            "AUTH-003", true, "Vikram Reddy", "9876543214", true, "Bangalore", 20.0
        );
        System.out.println("✅ Recycler 3 created");

        Recycler recycler4 = createRecycler(
            createUser("ewastehub@recircle.demo", "Recycler@123", "E-Waste Hub Delhi", "9876543215", User.UserRole.RECYCLER),
            "E-Waste Hub", "Delhi, NCR", 28.7041, 77.1025,
            "AUTH-004", true, "Arjun Singh", "9876543215", false, "Delhi NCR", 12.0
        );
        System.out.println("✅ Recycler 4 created");

        // Create Material Categories
        String[][] materialCategories = {
            {"CRT", "Cathode Ray Tube monitors and TVs", "120.0"},
            {"LCD Panel", "LCD screens and panels", "150.0"},
            {"PCB", "Printed Circuit Boards", "500.0"},
            {"Cable", "Copper and aluminum cables", "350.0"},
            {"Battery", "All types of batteries", "100.0"},
            {"Motor", "Electric motors", "250.0"},
            {"Magnet-bearing assembly", "Magnet and bearing assemblies", "200.0"},
            {"Mixed plastic", "Mixed plastic e-waste", "50.0"},
            {"Mobile phone", "Mobile phones and accessories", "800.0"},
            {"Laptop", "Laptops and notebooks", "900.0"},
            {"Other e-waste", "Other electronic waste", "300.0"}
        };

        for (String[] catData : materialCategories) {
            MaterialCategory category = new MaterialCategory();
            category.setName(catData[0]);
            category.setDescription(catData[1]);
            category.setDefaultPricePerKg(Double.parseDouble(catData[2]));
            category.setActive(true);
            
            // Add safety guidance
            String safety = switch (catData[0]) {
                case "Battery" -> "⚠️ Do not puncture. Do not burn. Do not crush. Keep away from water.";
                case "Cable" -> "⚠️ Do not burn cables. Separate copper from plastic when possible.";
                case "CRT" -> "⚠️ Handle carefully. Avoid unsafe breaking. Contains hazardous materials.";
                case "PCB" -> "⚠️ Do not use acid or unsafe chemical processing. Contains precious metals.";
                default -> "⚠️ Handle with care. Follow standard safety protocols.";
            };
            category.setSafetyGuidance(safety);
            
            MaterialCategory saved = categoryRepository.save(category);
            System.out.println("✅ Category: " + saved.getName());

            // Create price records
            for (int i = 0; i < 30; i++) {
                PriceRecord priceRecord = new PriceRecord();
                priceRecord.setMaterialCategory(saved);
                priceRecord.setPricePerKg(Double.parseDouble(catData[2]) + (Math.random() - 0.5) * 100);
                priceRecord.setLocation("India");
                priceRecord.setSource("MARKET");
                priceRecord.setRecordedAt(LocalDateTime.now().minusDays(30 - i));
                priceRecordRepository.save(priceRecord);
            }
        }

        // Create offers for each recycler
        var recyclers = recyclerRepository.findAll();
        var categories = categoryRepository.findAll();

        for (Recycler recycler : recyclers) {
            for (MaterialCategory category : categories) {
                if (Math.random() > 0.3) { // 70% chance of offering
                    RecyclerOffer offer = new RecyclerOffer();
                    offer.setRecycler(recycler);
                    offer.setMaterialCategory(category);
                    // Offer between 80% and 120% of default price
                    double multiplier = 0.8 + Math.random() * 0.4;
                    offer.setPricePerKg(category.getDefaultPricePerKg() * multiplier);
                    offer.setActive(true);
                    offerRepository.save(offer);
                }
            }
            System.out.println("✅ Offers created for: " + recycler.getCompanyName());
        }

        System.out.println("✅ Demo data seeding complete!");
        System.out.println("📝 Login credentials:");
        System.out.println("  Admin: admin@recircle.demo / Admin@123");
        System.out.println("  Collector: collector@recircle.demo / Collector@123");
        System.out.println("  Collector2: priya@recircle.demo / Collector@123");
        System.out.println("  Recycler: recycler@recircle.demo / Recycler@123");
        System.out.println("  Recycler2: ecorecycle@recircle.demo / Recycler@123");
        System.out.println("  Recycler3: techrecycle@recircle.demo / Recycler@123");
        System.out.println("  Recycler4: ewastehub@recircle.demo / Recycler@123");
    }

    private User createUser(String email, String password, String name, String phone, User.UserRole role) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(name);
        user.setPhoneNumber(phone);
        user.setRole(role);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    private void createCollectorProfile(User user, String address, double lat, double lng, String language) {
        CollectorProfile profile = new CollectorProfile();
        profile.setUser(user);
        profile.setAddress(address);
        profile.setLatitude(lat);
        profile.setLongitude(lng);
        profile.setPreferredLanguage(language);
        profile.setTotalLots(0);
        profile.setTotalEarnings(0.0);
        profile.setCompletedTransactions(0);
        profile.setVerified(true);
        collectorProfileRepository.save(profile);
    }

    private Recycler createRecycler(User user, String company, String address, double lat, double lng,
                                   String authNumber, boolean authorized, String contactPerson,
                                   String contactPhone, boolean pickup, String serviceArea, double radius) {
        Recycler recycler = new Recycler();
        recycler.setUser(user);
        recycler.setCompanyName(company);
        recycler.setFacilityAddress(address);
        recycler.setLatitude(lat);
        recycler.setLongitude(lng);
        recycler.setAuthorizationNumber(authNumber);
        recycler.setAuthorized(authorized);
        recycler.setContactPerson(contactPerson);
        recycler.setContactPhone(contactPhone);
        recycler.setPickupAvailable(pickup);
        recycler.setServiceArea(serviceArea);
        recycler.setServiceRadiusKm(radius);
        recycler.setActive(true);
        return recyclerRepository.save(recycler);
    }
}
