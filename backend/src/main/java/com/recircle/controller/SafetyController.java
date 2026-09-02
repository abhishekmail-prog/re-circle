package com.recircle.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/safety")
@CrossOrigin(origins = "*")
public class SafetyController {

    @GetMapping
    public ResponseEntity<?> getAllSafetyData() {
        Map<String, Object> response = new HashMap<>();
        response.put("general", getGeneralSafetyTips());
        response.put("materials", getMaterialSafetyData());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{material}")
    public ResponseEntity<?> getSafetyByMaterial(@PathVariable String material) {
        Map<String, Object> materialData = getMaterialSafetyData().stream()
            .filter(m -> m.get("category").toString().equalsIgnoreCase(material))
            .findFirst()
            .orElse(null);
        
        if (materialData == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Material not found"));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("guidance", materialData.get("guidance"));
        response.put("warnings", materialData.get("warnings"));
        response.put("emergency", materialData.get("emergency"));
        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> getGeneralSafetyTips() {
        List<Map<String, Object>> tips = new ArrayList<>();
        
        tips.add(Map.of(
            "icon", "🧤",
            "title", "Wear Protective Gear",
            "description", "Always wear gloves, safety glasses, and closed-toe shoes when handling e-waste."
        ));
        tips.add(Map.of(
            "icon", "😷",
            "title", "Use Respiratory Protection",
            "description", "Wear a dust mask or respirator when handling dusty or shredded materials."
        ));
        tips.add(Map.of(
            "icon", "🧼",
            "title", "Wash Hands Thoroughly",
            "description", "Always wash hands with soap and water after handling e-waste materials."
        ));
        tips.add(Map.of(
            "icon", "🚫",
            "title", "Keep Away from Children",
            "description", "E-waste contains hazardous materials. Keep away from children and pets."
        ));
        tips.add(Map.of(
            "icon", "💨",
            "title", "Work in Ventilated Areas",
            "description", "Always work in well-ventilated areas to avoid inhaling harmful fumes."
        ));
        tips.add(Map.of(
            "icon", "🔥",
            "title", "Avoid Heat Sources",
            "description", "Keep e-waste away from fire, sparks, and heat sources. Some materials are flammable."
        ));
        tips.add(Map.of(
            "icon", "📦",
            "title", "Proper Storage",
            "description", "Store e-waste in dry, cool areas. Use appropriate containers for different materials."
        ));
        tips.add(Map.of(
            "icon", "♻️",
            "title", "Separate Materials",
            "description", "Keep different types of e-waste separated for safe handling and recycling."
        ));

        return tips;
    }

    private List<Map<String, Object>> getMaterialSafetyData() {
        List<Map<String, Object>> materials = new ArrayList<>();

        // Battery
        Map<String, Object> battery = new HashMap<>();
        battery.put("category", "Battery");
        battery.put("icon", "🔋");
        battery.put("color", "#f44336");
        battery.put("guidance", List.of(
            "⚠️ Do NOT puncture or pierce batteries under any circumstances",
            "⚠️ Do NOT burn or expose batteries to high heat",
            "⚠️ Do NOT crush or deform batteries",
            "⚠️ Keep batteries away from water and moisture",
            "⚠️ Store batteries in a cool, dry place away from flammable materials",
            "⚠️ Tape terminals with non-conductive tape for storage",
            "⚠️ Do NOT attempt to disassemble or open batteries",
            "⚠️ For lithium batteries, use approved fireproof containers"
        ));
        battery.put("warnings", List.of(
            "☠️ Toxic chemicals can leak from damaged batteries",
            "🔥 Risk of fire or explosion if short-circuited",
            "💨 Can release harmful gases when damaged"
        ));
        battery.put("emergency", Map.of(
            "leak", "Avoid contact with skin. Use gloves and absorbent material.",
            "fire", "Use Class D fire extinguisher for metal fires. Do not use water.",
            "exposure", "Seek immediate medical attention if exposed to electrolyte."
        ));
        materials.add(battery);

        // CRT (Cathode Ray Tube)
        Map<String, Object> crt = new HashMap<>();
        crt.put("category", "CRT");
        crt.put("icon", "🖥️");
        crt.put("color", "#ff9800");
        crt.put("guidance", List.of(
            "⚠️ Handle CRT monitors with EXTREME care",
            "⚠️ Do NOT attempt to open CRT casings",
            "⚠️ Risk of implosion if damaged or dropped",
            "⚠️ Contains lead, mercury, and other hazardous materials",
            "⚠️ Use appropriate protective equipment",
            "⚠️ Do NOT break CRT glass",
            "⚠️ Store upright and secure to prevent falling"
        ));
        crt.put("warnings", List.of(
            "💥 Risk of implosion - glass fragments can fly",
            "☠️ Contains toxic lead and heavy metals",
            "⚡ Dangerous high voltage even when unplugged"
        ));
        crt.put("emergency", Map.of(
            "breakage", "Evacuate area immediately. Use proper cleanup procedures.",
            "exposure", "Wash affected areas thoroughly. Seek medical attention."
        ));
        materials.add(crt);

        // PCB (Printed Circuit Board)
        Map<String, Object> pcb = new HashMap<>();
        pcb.put("category", "PCB");
        pcb.put("icon", "💻");
        pcb.put("color", "#2196f3");
        pcb.put("guidance", List.of(
            "⚠️ Do NOT use acid or chemical processing for extraction",
            "⚠️ Contains precious metals but also hazardous materials",
            "⚠️ Use appropriate PPE (gloves, mask, safety glasses)",
            "⚠️ Avoid breaking boards - release toxic dust",
            "⚠️ Store in dry, cool location away from moisture",
            "⚠️ Handle components carefully - may contain sharp edges"
        ));
        pcb.put("warnings", List.of(
            "☠️ Contains lead, mercury, and other toxins",
            "💨 Toxic dust when broken or shredded",
            "⚡ Risk of electrical shock from capacitors"
        ));
        pcb.put("emergency", Map.of(
            "dust", "Use HEPA filtered vacuum. Wear respirator.",
            "burning", "Use dry chemical fire extinguisher. Toxic fumes."
        ));
        materials.add(pcb);

        // Cable
        Map<String, Object> cable = new HashMap<>();
        cable.put("category", "Cable");
        cable.put("icon", "🔌");
        cable.put("color", "#4caf50");
        cable.put("guidance", List.of(
            "⚠️ Do NOT burn cables to extract copper",
            "⚠️ Separate copper from plastic when possible",
            "⚠️ Avoid contact with water when stripping",
            "⚠️ Use proper wire stripping tools",
            "⚠️ Insulated cables may contain toxic materials",
            "⚠️ Store in organized manner to prevent tangling"
        ));
        cable.put("warnings", List.of(
            "☠️ Burning releases toxic fumes",
            "⚠️ Sharp edges when stripped",
            "⚠️ Some cables contain harmful chemicals"
        ));
        cable.put("emergency", Map.of(
            "burning", "Use appropriate fire extinguisher. Avoid smoke inhalation.",
            "injury", "Clean and bandage wounds from sharp wires."
        ));
        materials.add(cable);

        // LCD Panel
        Map<String, Object> lcd = new HashMap<>();
        lcd.put("category", "LCD Panel");
        lcd.put("icon", "📱");
        lcd.put("color", "#9c27b0");
        lcd.put("guidance", List.of(
            "⚠️ Handle LCD screens with extreme care",
            "⚠️ Do NOT break or shatter LCD panels",
            "⚠️ Contains mercury and other hazardous materials",
            "⚠️ Toxic liquid crystal can leak if damaged",
            "⚠️ Use proper storage to prevent cracking",
            "⚠️ Do NOT bend or flex panels"
        ));
        lcd.put("warnings", List.of(
            "☠️ Contains mercury vapor in backlights",
            "💧 Toxic liquid crystal leaks from damage",
            "⚠️ Sharp glass fragments when broken"
        ));
        lcd.put("emergency", Map.of(
            "breakage", "Ventilate area. Use gloves for cleanup.",
            "exposure", "Wash skin immediately. Seek medical advice."
        ));
        materials.add(lcd);

        // Motor
        Map<String, Object> motor = new HashMap<>();
        motor.put("category", "Motor");
        motor.put("icon", "⚡");
        motor.put("color", "#ff5722");
        motor.put("guidance", List.of(
            "⚠️ Handle heavy motors with care - risk of injury",
            "⚠️ Discharge capacitors before handling",
            "⚠️ Contains copper, steel, and sometimes hazardous materials",
            "⚠️ Check for oil leaks from older motors",
            "⚠️ Use proper lifting techniques",
            "⚠️ Store in dry place to prevent corrosion"
        ));
        motor.put("warnings", List.of(
            "⚡ Risk of electrical shock from capacitors",
            "💧 Oil contamination from older motors",
            "⚠️ Heavy objects - risk of crush injuries"
        ));
        motor.put("emergency", Map.of(
            "shock", "Seek immediate medical attention.",
            "oil spill", "Use absorbent material. Proper disposal."
        ));
        materials.add(motor);

        return materials;
    }
}
