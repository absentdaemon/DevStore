# Read-Only Android Investigation: Google Play Store Application

**Target Application:** Google Play Store Client (`com.android.vending`)  
**Target Environment:** Physical Android Phone (Non-modified, non-rooted, USB debugging disabled)  
**Host Environment:** Windows PC / Google Antigravity IDE / REA v6.7.0  
**Investigation Framework:** REA (Reverse Engineer Anything) Android & ADB Capabilities  
**Output Document:** `research/google-play-android.md`  
**Status:** Diagnostic & Dependency Audit Complete (Blocked pending external prerequisites; zero changes made to device)

---

## 1. Executive Summary

This phase aimed to perform an authorized, read-only investigation of the Google Play Store Android application installed on the user's Android phone.

In strict adherence to the project safety rules:
- **No device settings were altered** (USB debugging was not enabled).
- **No applications were installed, pulled, modified, repackaged, or signed**.
- **No private user data, accounts, purchase records, or device credentials were accessed**.
- **No licensing or device integrity mechanisms were bypassed**.

A live probe using REA's official `inspect_adb_client` confirmed that the Android Debug Bridge (`adb`) is **unavailable** on the host. Furthermore, no local APK artifact exists in the project workspace, and the Java JDK and JADX reverse-engineering runtime are not yet configured. Consequently, direct device querying and static APK decompilation are currently blocked.

---

## 2. REA Android Tool Catalog & Environmental Readiness

REA exposes two distinct tool families for Android reverse engineering:
1. **Device & Package Telemetry (`adb` toolchain):** Interacts with attached Android runtimes in a safe, read-only manner.
2. **Static APK Decompilation (`jadx` / `java` toolchain):** Disassembles, parses manifests, and decompiles Dalvik bytecode without executing the target.

| REA Tool Name | Category | Primary Function | Current Session Status | Specific Blocker / Requirement |
| :--- | :--- | :--- | :---: | :--- |
| `inspect_adb_client` | Device Bridge | Probes host ADB binary and version | **Tested (Failed)** | `adb` executable not found on host `PATH` |
| `list_adb_devices` | Device Bridge | Lists connected emulators/devices (`adb devices -l`) | **Blocked** | Requires operational ADB client |
| `list_adb_packages` | Device Bridge | Lists installed package names and base APK paths | **Blocked** | Requires operational ADB client & device connection |
| `inspect_adb_package` | Device Bridge | Queries package metadata and version from device | **Blocked** | Requires operational ADB client & device connection |
| `pull_adb_package` | Extraction | Pulls installed APK split set with SHA-256 verification | **Blocked** | Requires operational ADB client & user authorization |
| `inspect_android_package`| Static Analysis | Decodes APK manifest, SDK targets, permissions | **Blocked** | Requires local APK artifact + JDK 17+ & JADX MCP JAR |
| `search_android_classes` | Static Analysis | Searches DEX classes and namespaces | **Blocked** | Requires local APK artifact + JDK 17+ & JADX MCP JAR |
| `inspect_android_class` | Static Analysis | Inspects methods, fields, and byte offsets | **Blocked** | Requires local APK artifact + JDK 17+ & JADX MCP JAR |
| `inspect_android_method`| Static Analysis | Decompiles target method to Java pseudocode | **Blocked** | Requires local APK artifact + JDK 17+ & JADX MCP JAR |
| `trace_android_references`| Static Analysis | Maps static call graphs and class dependencies | **Blocked** | Requires local APK artifact + JDK 17+ & JADX MCP JAR |
| `project_android_application_graph` | Static Analysis | Projects APK inventory into structural graph | **Blocked** | Requires local APK artifact + JDK 17+ & JADX MCP JAR |

---

## 3. Verified Observations

1. **Host ADB Client Status:**
   - REA tool executed: `inspect_adb_client` with parameters `{}`.
   - Live result:
     ```json
     {
       "code": "capability_unavailable",
       "category": "unsupported_provider",
       "message": "The selected adb binary was not found: adb. Set REA_ADB_PATH to an absolute path to an existing adb binary.",
       "details": {
         "provider_id": "adb",
         "operation": "inspect_adb_client"
       }
     }
     ```
   - *Confirmation:* No `adb.exe` executable is available in the system `PATH` or configured via `REA_ADB_PATH`.
2. **Local Workspace Inventory:**
   - The workspace [`d:\Playstore`](file:///d:/Playstore) contains no `.apk` or `.apks` files.
3. **Decompiler Backend Status:**
   - As verified in Section 1 diagnostics, Java JDK is not installed (`java` and `javac` not found; `JAVA_HOME` empty).
   - REA's required `jadx-headless-mcp 0.7.1` JAR is not present (`REA_JADX_MCP_JAR` unset).
4. **Device Integrity:**
   - The physical phone was neither probed nor modified. USB debugging remains disabled.

---

## 4. Technical Inferences (Ecosystem Architecture)

Based on official Android OS documentation and architectural patterns confirmed during the web investigation:

1. **Canonical Package Identity:**
   - In the Android ecosystem, the client application for Google Play is historically and canonically identified as **`com.android.vending`**.
   - Supporting infrastructure services are provided by Google Play Services (`com.google.android.gms`).
2. **Modern Packaging Architecture (Android App Bundles / Split APKs):**
   - The Play Store app is distributed as an optimized set of **Split APKs** (including `base.apk`, architecture splits such as `split_config.arm64_v8a.apk`, and display density/language splits).
   - Any future authorized inspection would need to operate on the consolidated APK set rather than an isolated standalone APK.
3. **Role of JADX vs. Ghidra in Android Analysis:**
   - **JADX:** Operates on Dalvik Executable (`.dex`) files. It decompiles bytecode into structured Java/Kotlin source code, reconstitutes `AndroidManifest.xml`, and decodes Android resources. It is required for inspecting UI Activities, Service lifecycles, and search intent routing.
   - **Ghidra:** Operates on native machine code compiled for specific CPU architectures (e.g., ARM64 ELF shared libraries `.so` located in `lib/arm64-v8a/`). Google Play utilizes native binaries for performance-critical operations, cryptographic signatures, attestation, and IPC. Ghidra is required when analyzing JNI (Java Native Interface) boundaries.

---

## 5. Unknowns

The following attributes **cannot be verified** in the current environment without guessing or violating project rules:
1. **Installed Version & Build Number:** The exact version (e.g., `versionName`, `versionCode`) of Google Play Store currently running on the user's phone cannot be determined without ADB or a local APK.
2. **Declared Permissions & Manifest Entries:** The specific permissions (`uses-permission`), exported components (`activities`, `services`, `providers`), and intent filters cannot be read because no decoded manifest is available.
3. **Device Configuration & Target SDK:** Minimum SDK (`minSdkVersion`) and target SDK (`targetSdkVersion`) declared in the phone's installed build are unknown.
4. **Hardware Split Configurations:** The exact split variants loaded on the user's specific hardware model remain unverified.

---

## 6. Static Analysis vs. Runtime Behavior Limitations

When analyzing Android applications, static analysis and runtime observation have distinct capabilities and limitations:

| Analysis Dimension | Static Analysis (JADX / Ghidra) | Runtime Observation (ADB / Logcat / Frida) |
| :--- | :--- | :--- |
| **Visibility** | Complete recovered class declarations, hardcoded strings, declared manifest intents, component interfaces. | Live event execution, instantiated memory objects, active IPC calls, dynamic network responses. |
| **Obfuscation** | Obfuscated class/method names (e.g. `a.b.c`) can make manual navigation laborious. | Method execution and data flows can be traced at runtime regardless of symbol renaming. |
| **Dynamic Code** | Cannot inspect dynamically loaded classes, reflection, or payloads retrieved over the network. | Directly observes loaded classes and runtime behavior as they occur in memory. |
| **Integrity Checks** | Can identify static checks and signature validation logic. | Subject to device integrity enforcement, safety attestation, and anti-tamper safeguards. |

---

## 7. Missing Dependencies & Actionable Remediation Plan

To enable read-only Android application analysis in future phases, the following dependencies must be installed and configured:

```
[Missing Dependency 1: Android SDK Platform Tools (adb)]
  ├── Purpose: Enables read-only device queries (package list, version, logs)
  └── Remediation: Download Google Platform-Tools for Windows and append to system PATH.

[Missing Dependency 2: Java Development Kit (JDK 17 or 21)]
  ├── Purpose: Runtime engine required by both JADX and Ghidra
  └── Remediation: Install Eclipse Adoptium Temurin OpenJDK 21 LTS; set JAVA_HOME.

[Missing Dependency 3: JADX Headless MCP Server]
  ├── Purpose: Bytecode decompilation and APK manifest extraction for REA
  └── Remediation: Provide jadx-headless-mcp-0.7.1.jar and set REA_JADX_MCP_JAR.

[Missing Dependency 4: Ghidra (v12.1.x)]
  ├── Purpose: Native binary disassembly/decompilation (C/C++ .so shared libraries)
  └── Remediation: Extract Ghidra release and set GHIDRA_INSTALL_DIR.
```

---

## 8. Recommended Next Steps

1. **Option A (Complete Prerequisite Setup):**
   - Install **Android Platform-Tools (`adb`)** to allow non-invasive device queries.
   - Install **OpenJDK 21** and configure `JAVA_HOME`.
   - Provide **`jadx-headless-mcp.jar`** and configure `REA_JADX_MCP_JAR`.
2. **Option B (Authorized APK Staging):**
   - If an authorized, publicly available Google Play Store APK is already archived on your PC, stage it in the workspace for static, offline inspection without connecting the physical phone.
3. **Option C (Software Reconstruction from Web Findings):**
   - Proceed with designing and reconstructing the Play Store search feature using the comprehensive web specification established in `research/google-play-search.md`.

---

*In accordance with project guidelines, all execution has ceased. No phone modifications, package extractions, or code implementations will occur without your explicit approval.*
