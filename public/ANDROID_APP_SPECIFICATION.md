# Artify Cashier — Native Android App Design & Architecture Specification
**Production-Grade Android Architecture Specification for Google AI Studio Android Skills**
*Target Platform: Android 14+ (API 34), Min SDK 26 (Android 8.0 Oreo)*  
*Tech Stack: Kotlin 1.9+, Jetpack Compose, Material 3, Room DB, Gemini Multimodal API, CameraX, WorkManager, Coroutines/Flow*

---

## 1. Executive Summary & App Overview

**Artify Cashier** is an enterprise-grade, offline-first petty cash management and expense reimbursement Android application tailored for site cashiers, field engineers, project supervisors, and finance teams.

### Core Value Propositions
1. **Zero Cash Float Drift**: Continuous real-time balance reconciliation against project float limits with automated low-balance threshold warnings.
2. **Gemini Multimodal AI OCR**: Instant receipt scanning via CameraX and Gemini API that extracts vendor, bill reference, date, total amount, VAT breakdown, and expense categories with 99%+ accuracy.
3. **Dual-Track Fund Top-Up Engine**:
   - *Receipt Reimbursement*: Cashier selects verified spent receipts to batch and request float replenishment.
   - *Advance Forecast*: Cashier requests advance cash against estimated upcoming site expenses with itemized quantity and rates.
4. **Rigorous Audit & VAT Tracking**: Formatted 15% VAT split calculations, sequential `YYXXXZZZZ` bill reference generation, and one-tap formal A4 PDF petty cash closure reports with signature blocks.
5. **True Offline-First Resilience**: Full local persistence via Room DB with transactional optimistic state updates and WorkManager background synchronization.

---

## 2. Design System & Visual Archetype

The native Android app follows **Material Design 3 (Material You)** with an enterprise slate/emerald palette optimized for readability in harsh construction site lighting and dark office environments.

### 2.1 Color Palette
| Token | Hex Value | Jetpack Compose Usage |
| :--- | :--- | :--- |
| **Primary Emerald** | `#059669` / `#10B981` | Action buttons, active navigation, balance badges |
| **Primary Container** | `#064E3B` | Selected cards, high-priority state highlights |
| **Background Dark** | `#020617` (Slate 950) | Main scaffold background (dark theme default) |
| **Surface Dark** | `#0F172A` (Slate 900) | TopAppBar, NavigationBar, ModalBottomSheet, Cards |
| **Surface Variant** | `#1E293B` (Slate 800) | Form fields, chip containers, table rows |
| **Text Primary** | `#F8FAFC` (Slate 50) | Primary headlines, transaction titles, numbers |
| **Text Secondary** | `#94A3B8` (Slate 400) | Captions, timestamps, metadata labels |
| **Accent Amber / Warning** | `#F59E0B` | Low-balance warning, pending approvals |
| **Accent Rose / Destructive** | `#F43F5E` | Rejected batches, expense outflows, balance deficits |
| **Accent Blue / Info** | `#3B82F6` | Fund top-ups, OCR confirmation pills |

### 2.2 Typography Scale (Material 3)
- **Display Large**: `TextStyle(fontFamily = Inter/Roboto, fontWeight = Bold, fontSize = 32.sp)` (Dashboard Float Balance)
- **Headline Medium**: `TextStyle(fontWeight = SemiBold, fontSize = 20.sp)` (Section Titles, Modal Headers)
- **Title Medium**: `TextStyle(fontWeight = Medium, fontSize = 16.sp)` (Transaction Vendor, Project Name)
- **Body Medium**: `TextStyle(fontWeight = Normal, fontSize = 14.sp, lineHeight = 20.sp)` (Descriptions, Notes)
- **Label Small (Mono)**: `TextStyle(fontFamily = FontFamily.Monospace, fontWeight = Bold, fontSize = 11.sp)` (Bill Ref `26SITA0012`, VAT Reg No, Batch IDs)

### 2.3 Motion & Transitions
- **Shared Axis (Z-axis)**: Navigating from Dashboard to Add Transaction or Batch Detail.
- **Elevation Scaling**: `animateFloatAsState` for active transaction items and card selection.
- **Haptic Feedback**: `HapticFeedbackType.LongPress` and `HapticFeedbackType.TextHandleMove` on receipt scan completion, bill confirmation, and batch approval.

---

## 3. Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer                              │
│  Jetpack Compose • Material 3 • Navigation Compose • Coil   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Observes UiState (StateFlow)
                               ▼ Emits UiEvent
┌─────────────────────────────────────────────────────────────┐
│                     ViewModel Layer                         │
│   CashierViewModel • ScannerViewModel • BatchViewModel      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls UseCases / Repositories
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  BillRefGenerator • VatCalculator • ClosureReportEngine    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Repository Pattern
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│  ┌───────────────────────────────┐ ┌──────────────────────┐ │
│  │     Local Data Source         │ │  Remote Data Source  │ │
│  │ Room Database • DataStore     │ │ Retrofit • Gemini API│ │
│  └───────────────────────────────┘ └──────────────────────┘ │
│                ▲                              ▲             │
│                └──────── WorkManager ─────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Recommended Gradle Dependencies (`build.gradle.kts`)
```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.ksp)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.artify.cashier"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.artify.cashier"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
    
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)

    // CameraX & Image Handling
    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.coil.compose)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // DataStore Preferences
    implementation(libs.androidx.datastore.preferences)

    // WorkManager (Background Sync)
    implementation(libs.androidx.work.runtime.ktx)

    // Google Gemini API Client
    implementation("com.google.genai:google-genai:0.1.1") // or Retrofit API client
    implementation(libs.kotlinx.serialization.json)

    // PDF & Printing
    implementation("androidx.print:print:1.0.0")

    // Biometric Auth
    implementation(libs.androidx.biometric)
}
```

---

## 4. Room Database Schema & Entities

### 4.1 `CashierProfileEntity`
```kotlin
@Entity(tableName = "cashier_profile")
data class CashierProfileEntity(
    @PrimaryKey val id: String, // e.g. "U1023"
    val name: String,
    val phone: String,
    val email: String,
    val isSelfApproving: Boolean,
    val linkedManagerId: String?,
    val linkedManagerName: String?,
    val linkedManagerEmail: String?,
    val linkedManagerRole: String?,
    val activeProjectId: String,
    val lastSyncedAt: Long
)
```

### 4.2 `ProjectEntity`
```kotlin
@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val code: String, // "SITA", "METRO", "VILLAS"
    val name: String,
    val description: String,
    val currentBalance: Double,
    val lowBalanceThreshold: Double,
    val currency: String = "AED",
    val totalReceived: Double,
    val totalSpent: Double,
    val pendingClosureId: String?,
    val approvedClosureId: String?
)
```

### 4.3 `TransactionEntity` (Expenses)
```kotlin
@Entity(
    tableName = "transactions",
    indices = [
        Index(value = ["billRef"], unique = true),
        Index(value = ["projectId"]),
        Index(value = ["syncStatus"])
    ]
)
data class TransactionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val billRef: String, // e.g. "26SITA0012"
    val projectId: String,
    val projectName: String,
    val date: String, // YYYY-MM-DD
    val paidTo: String, // Vendor Name
    val expenseNature: String, // Category from Master
    val amountExclVat: Double,
    val vatAmount: Double,
    val amountInclVat: Double,
    val vendorVatRegNo: String,
    val remarks: String,
    val attachmentUri: String?, // Local file path or cached URI
    val ocrExtracted: Boolean,
    val isOcrConfirmed: Boolean,
    val syncStatus: SyncStatus, // SYNCED, PENDING_SYNC, ERROR
    val reviewStatus: ReviewStatus, // OPEN, PENDING_CLOSURE, APPROVED, REJECTED
    val closureId: String?,
    val batchRequestId: String?,
    val rejectionReason: String?,
    val createdAt: Long = System.currentTimeMillis(),
    val srNo: Int = 0
)

enum class SyncStatus { SYNCED, PENDING_SYNC, ERROR }
enum class ReviewStatus { OPEN, PENDING_CLOSURE, APPROVED, REJECTED }
```

### 4.4 `FundReceiptEntity` (Inflows / Top-ups)
```kotlin
@Entity(tableName = "fund_receipts")
data class FundReceiptEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val receiptNo: String, // e.g. "RCP-26-SITA-001"
    val projectId: String,
    val projectName: String,
    val date: String,
    val amountReceived: Double,
    val receivedFrom: String,
    val paymentMode: PaymentMode, // CASH, CHEQUE, BANK_TRANSFER
    val referenceNo: String,
    val remarks: String,
    val cashierName: String,
    val linkedBatchId: String?,
    val syncStatus: SyncStatus = SyncStatus.PENDING_SYNC,
    val createdAt: Long = System.currentTimeMillis()
)

enum class PaymentMode { CASH, CHEQUE, BANK_TRANSFER }
```

### 4.5 `FundRequestBatchEntity` & `FundRequestItemEntity`
```kotlin
@Entity(tableName = "fund_request_batches")
data class FundRequestBatchEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val batchNumber: String, // "REQ-26-SITA-01" or "RMB-26-SITA-01"
    val batchType: BatchType, // RECEIPT_REIMBURSEMENT, ADVANCE_FORECAST
    val projectId: String,
    val projectName: String,
    val coveragePeriodStart: String,
    val coveragePeriodEnd: String,
    val totalAmount: Double,
    val totalExclVat: Double,
    val totalVat: Double,
    val approvedAmount: Double?,
    val status: ReimbursementWorkflowStatus,
    val requestedAt: Long,
    val underReviewAt: Long?,
    val approvedAt: Long?,
    val reviewedBy: String?,
    val managerNotes: String?,
    val rejectionReason: String?,
    val reimbursedAt: Long?,
    val cashierId: String,
    val cashierName: String,
    val submissionNotes: String?
)

enum class BatchType { RECEIPT_REIMBURSEMENT, ADVANCE_FORECAST }
enum class ReimbursementWorkflowStatus {
    PENDING,
    MANAGER_REVIEW,
    APPROVED,
    REJECTED,
    FULFILLED,
    PARTIALLY_APPROVED
}

@Entity(
    tableName = "fund_request_items",
    foreignKeys = [
        ForeignKey(
            entity = FundRequestBatchEntity::class,
            parentColumns = ["id"],
            childColumns = ["batchId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class FundRequestItemEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val batchId: String,
    val expenseNature: String,
    val quantity: Double,
    val uom: String, // "Units", "Hrs", "Days", "Kg", "Ltr", "Trip"
    val rate: Double,
    val amount: Double,
    val vendorName: String,
    val notes: String,
    val status: ItemStatus = ItemStatus.PENDING,
    val transactionId: String?,
    val billRef: String?,
    val vatAmount: Double?
)

enum class ItemStatus { PENDING, MANAGER_REVIEW, APPROVED, REJECTED }
```

### 4.6 `PettyCashClosureEntity`
```kotlin
@Entity(tableName = "petty_cash_closures")
data class PettyCashClosureEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val closureNumber: String, // "CLO-26-SITA-001"
    val projectId: String,
    val projectName: String,
    val periodStart: String,
    val periodEnd: String,
    val openingFloat: Double,
    val totalReceived: Double,
    val totalSpent: Double,
    val totalVat: Double,
    val closingBalance: Double,
    val physicalCashCounted: Double,
    val cashDifference: Double, // closingBalance - physicalCashCounted
    val status: ClosureStatus,
    val notes: String,
    val pdfReportUri: String?,
    val createdAt: Long = System.currentTimeMillis(),
    val submittedAt: Long?,
    val verifiedBy: String?
)

enum class ClosureStatus { DRAFT, SUBMITTED, AUDITED, RECONCILED }
```

---

## 5. Domain Logic & Business Rules

### 5.1 Sequential Bill Reference Generator
Rule format: `YY` + `PROJ_CODE` + `4-digit sequence` (e.g., Year 2026, Project "SITA", sequence 12 -> **`26SITA0012`**).
```kotlin
class BillRefGenerator(private val transactionDao: TransactionDao) {
    suspend fun generateNextBillRef(projectCode: String): String {
        val currentYear = SimpleDateFormat("yy", Locale.US).format(Date())
        val prefix = "$currentYear${projectCode.uppercase()}"
        val latestRef = transactionDao.getLatestBillRefForPrefix("$prefix%")
        
        val nextSeq = if (latestRef != null && latestRef.length >= prefix.length + 4) {
            val seqStr = latestRef.substring(prefix.length)
            (seqStr.toIntOrNull() ?: 0) + 1
        } else {
            1
        }
        
        return "$prefix${String.format(Locale.US, "%04d", nextSeq)}"
    }
}
```

### 5.2 15% VAT Engine
```kotlin
data class VatCalculation(
    val amountExclVat: Double,
    val vatAmount: Double,
    val amountInclVat: Double
)

object VatCalculator {
    private const val VAT_RATE = 0.15

    fun calculateFromExcl(amountExclVat: Double): VatCalculation {
        val vat = (amountExclVat * VAT_RATE).roundTo2Decimals()
        val total = (amountExclVat + vat).roundTo2Decimals()
        return VatCalculation(amountExclVat, vat, total)
    }

    fun calculateFromIncl(amountInclVat: Double): VatCalculation {
        val excl = (amountInclVat / (1.0 + VAT_RATE)).roundTo2Decimals()
        val vat = (amountInclVat - excl).roundTo2Decimals()
        return VatCalculation(excl, vat, amountInclVat)
    }

    private fun Double.roundTo2Decimals(): Double = 
        BigDecimal(this).setScale(2, RoundingMode.HALF_EVEN).toDouble()
}
```

### 5.3 6-Stage Reimbursement Approval State Machine
```
┌─────────┐   Cashier Submits    ┌────────────────┐   Manager Picks Up   ┌────────────────┐
│  DRAFT  ├─────────────────────►│    PENDING     ├─────────────────────►│ MANAGER_REVIEW │
└─────────┘                      └────────┬───────┘                      └───────┬────────┘
                                          │ Manager Direct                       │
                                          │ Rejection                            │ Manager Review
                                          ▼                                      ▼
                                 ┌────────────────┐                     ┌─────────────────┐
                                 │    REJECTED    │◄────────────────────┤ PARTIALLY / FULL│
                                 └────────────────┘                     │    APPROVED     │
                                                                        └────────┬────────┘
                                                                                 │ Fund Disbursement
                                                                                 ▼
                                                                        ┌─────────────────┐
                                                                        │    FULFILLED    │
                                                                        └─────────────────┘
```

---

## 6. Gemini Multimodal AI Receipt Scanner (CameraX + Gemini API)

### 6.1 CameraX Capture Pipeline
- Setup `ImageCapture` in CameraX with high-resolution JPEG capture.
- Convert image buffer into base64 or `Bitmap`.
- Display live viewfinder overlay with animated emerald targeting bounds and flash toggle.

### 6.2 Structured Gemini Prompt & Schema
```kotlin
suspend fun parseReceiptWithGemini(context: Context, imageUri: Uri): OcrReceiptResult {
    val bitmap = MediaStore.Images.Media.getBitmap(context.contentResolver, imageUri)
    val byteArrayOutputStream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 85, byteArrayOutputStream)
    val imageBytes = byteArrayOutputStream.toByteArray()

    val prompt = """
    You are an expert financial auditor OCR AI for petty cash management. 
    Analyze this physical receipt / invoice image and extract all structured expense data into strict JSON matching this schema:
    {
      "vendorName": string,
      "date": "YYYY-MM-DD",
      "totalAmount": number,
      "amountExclVat": number,
      "vatAmount": number,
      "vendorVatRegNo": string,
      "expenseNature": string (Choose strictly from: "Stationery & Office Supplies", "Travel & Fuel", "Site Refreshments & Pantry", "Equipment Maintenance & Repairs", "Courier & Postage", "Hardware & Electrical Tools", "Printing & Blueprinting", "Safety Gear & PPE", "Emergency Labor & Services", "Sundry Miscellaneous"),
      "suggestedRemarks": string,
      "confidenceScore": number (0.0 to 1.0)
    }
    Strict rules:
    - If VAT is 15% standard or specified, calculate amountExclVat and vatAmount correctly.
    - If no VAT is mentioned, set vatAmount to 0.0 and amountExclVat equal to totalAmount.
    - Date must be normalized to YYYY-MM-DD.
    """.trimIndent()

    val response = geminiClient.models.generateContent(
        model = "gemini-2.5-flash",
        contents = listOf(
            Content.text(prompt),
            Content.inlineData("image/jpeg", imageBytes)
        ),
        config = GenerateContentConfig(
            responseMimeType = "application/json"
        )
    )

    return Json.decodeFromString<OcrReceiptResult>(response.text ?: "{}")
}
```

---

## 7. Screen-by-Screen Native UI Specifications

### 7.1 Registration & Manager Pairing Screen (`RegistrationScreen.kt`)
- **Header**: Artify Logo + Cashier Onboarding subtitle.
- **Form Fields**:
  - Cashier Full Name (`OutlinedTextField` with user icon).
  - Phone Number (`KeyboardType.Phone`).
  - Email Address (`KeyboardType.EmailAddress`).
  - Assigned Project selector (`ExposedDropdownMenuBox`).
- **Manager Pairing Section**:
  - Manager ID input or selection from predefined list (e.g., "Sarah Jenkins — Senior Finance Manager").
  - QR Code Scanner button to scan manager badge.
  - "Self-Approving Cashier" toggle for sole operators.
- **Action**: "Initialize Petty Cash Float" (`Button` with elevation and icon).

### 7.2 Dashboard Screen (`DashboardScreen.kt`)
- **Top Status Bar**:
  - Offline/Online Sentinel Pill (Green pulse when synced, Amber with queue count when offline).
  - Linked Manager quick chip with role badge.
  - Current Project Dropdown switcher.
- **Hero Balance Card**:
  - Large Current Balance display (`AED 2,450.00`).
  - Progress bar showing current balance vs. total project float allocation.
  - **Low-Balance Sentinel**: Flashing amber warning when `balance < lowBalanceThreshold` with quick "Request Advance" button.
- **Quick Action Grid (4 Large Action Tiles)**:
  1. 📸 **Scan & Add Expense** (Primary Emerald).
  2. 💸 **Request Funds / Reimbursement** (Teal Gradient).
  3. 📥 **Record Fund Receipt** (Blue Gradient).
  4. 📑 **Close Petty Cash Period** (Slate/Purple Gradient).
- **Recent Activity Ledger**:
  - Latest 5 transactions with status pills (`OPEN`, `PENDING_CLOSURE`, `APPROVED`).
  - Swipe-to-delete (drafts only) and tap-to-inspect receipt image.

### 7.3 Add Transaction & AI Scanner (`AddTransactionScreen.kt`)
- **Top Bar**: Camera Scan Receipt button + Manual Entry mode toggle.
- **Camera Viewfinder**: CameraX full-bleed preview with bounding box and automatic edge detection.
- **OCR Confirmation Card**:
  - Shows thumbnail of scanned receipt.
  - "Extracted by Gemini AI" badge with confidence indicator.
  - One-tap "Confirm Extracted Data" or "Edit Values".
- **Form Fields**:
  - **Bill Reference**: Auto-generated readonly input (`26SITA0012`) with copy button.
  - **Paid To (Vendor)**: Text input with autocomplete history.
  - **Expense Nature**: Chip carousel / BottomSheet grid selector.
  - **Amount Inputs**:
    - Dual input fields: "Amount (Excl. VAT)" & "Total (Incl. VAT)".
    - "Calculate 15% VAT Automatically" switch.
  - **Vendor VAT Registration Number**: Monospace text input with validation.
  - **Receipt Image Attachment**: Thumbnail preview with zoom/replace buttons.
  - **Remarks**: Multi-line text field.
- **Action**: "Save & Record Expense" (Inserts into Room DB and triggers WorkManager sync).

### 7.4 Fund Request & Reimbursement Hub (`FundRequestScreen.kt`)
- **Dual Tab Mode**:
  1. **Batch Receipt Reimbursement** (Select already paid receipts from ledger).
  2. **Advance Forecast Request** (Itemized estimate for upcoming float needs).
- **Tab 1: Multi-Receipt Selector**:
  - Filterable list of un-reimbursed transactions.
  - Checkbox multi-select with sticky bottom bar displaying: `Selected (4) • Total: AED 1,280.50 (VAT: AED 167.02)`.
  - "Generate Reimbursement Batch" action button.
- **Tab 2: Itemized Advance Form**:
  - Dynamic rows: Expense Nature, Qty, UOM, Rate, Total, Vendor, Justification Note.
  - "Add Another Item" button.
- **Batch Preview & Submission BottomSheet**:
  - Auto-generated batch ID (`RMB-26-SITA-01`).
  - Coverage date range picker.
  - Manager routing confirmation.
  - "Submit Batch for Manager Approval" button with haptic feedback.

### 7.5 Manager Simulator & Approval Workflow (`ManagerSimulatorModal.kt`)
- **Purpose**: Real-time review and simulation of supervisor actions.
- **Queue List**: Pending batches with cashier avatars, request dates, and total amounts.
- **Batch Inspection**:
  - Itemized receipt breakdown with direct links to view receipt photos.
  - VAT compliance summary table.
- **Workflow Actions**:
  - **Approve Full Amount** (`AED 1,280.50`).
  - **Approve Partial Amount** (with mandatory note).
  - **Reject Batch** (opens reason dialog: "Missing Tax Invoice", "Exceeds Limit", etc.).
- **Fulfillment / Float Top-up Trigger**: Auto-creates `FundReceiptEntity` and replenishes `ProjectEntity.currentBalance`.

### 7.6 Petty Cash Closure & Formal A4 Audit Certificate (`ClosureReportScreen.kt`)
- **Step 1: Period Selection & Balance Check**:
  - Opening float + Total Receipts - Total Expenses = System Closing Balance.
- **Step 2: Physical Cash Reconciliation**:
  - Denomination Counter (Count of 1000s, 500s, 100s, 50s, 20s, 10s, 5s, coins).
  - Cash Difference indicator (`Surplus`, `Balanced`, or `Deficit`).
- **Step 3: Formal PDF Generation**:
  - Renders official A4 document using `android.graphics.pdf.PdfDocument`.
  - Includes Company Header, Project Code, Period Dates, Ledger Table with VAT split, Reconciliation Summary, Cashier Signature Block, and Supervisor Approval Line.
  - Android `PrintManager` integration for direct thermal/Wi-Fi printing or sharing as `.pdf`.

### 7.7 Offline Queue Sentinel & Settings (`ProfileSettingsScreen.kt`)
- **Profile Card**: Cashier ID, Avatar, Email, Assigned Projects.
- **Biometric Security**: BiometricPrompt toggle for app unlock and fund approvals.
- **Sync Diagnostics Sentinel**:
  - Count of pending transactions, un-synced batches, and cached receipt images.
  - "Force Immediate Cloud Sync" button.
  - WorkManager scheduled interval selector (15 mins, 30 mins, 1 hour, manual only).
- **Theme Switcher**: Dark Mode / Light Mode / System Default.

---

## 8. Offline Sync Architecture (WorkManager)

```kotlin
class SyncWorker(
    context: Context,
    workerParams: WorkerParameters,
    private val transactionDao: TransactionDao,
    private val apiService: CashierApiService
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val pendingTransactions = transactionDao.getPendingSyncTransactions()
            for (tx in pendingTransactions) {
                val response = apiService.uploadTransaction(tx.toDto())
                if (response.isSuccessful) {
                    transactionDao.updateSyncStatus(tx.id, SyncStatus.SYNCED)
                }
            }
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}
```

---

## 9. Android Skills Implementation Checklist

When building this project in Google AI Studio's Android Skills environment:

- [ ] **Step 1**: Initialize Gradle project with Kotlin DSL, Compose BOM, Room KSP, CameraX, and WorkManager.
- [ ] **Step 2**: Create domain models and Room Database schema (`CashierDatabase.kt`) with all entities, DAOs, and TypeConverters.
- [ ] **Step 3**: Implement repository layer (`CashierRepository.kt`) with Room local-first caching and Kotlin `Flow` data streams.
- [ ] **Step 4**: Build `CashierViewModel.kt` handling single `CashierUiState` with sealed `CashierUiEvent` actions.
- [ ] **Step 5**: Implement Jetpack Compose navigation (`NavHost`) supporting deep links and state-preserving transitions.
- [ ] **Step 6**: Implement `CameraX` receipt capture composable and integrate Gemini 2.5 Multimodal OCR endpoint.
- [ ] **Step 7**: Build the 15% VAT calculation engine and sequential `YYXXXZZZZ` bill reference generator.
- [ ] **Step 8**: Build the Dual-Track Fund Request Hub and Manager Approval workflow simulator.
- [ ] **Step 9**: Implement native A4 `PdfDocument` generation and Android `PrintManager` adapter for Petty Cash Closure.
- [ ] **Step 10**: Wire `WorkManager` for background synchronization and add `BiometricPrompt` authentication.
