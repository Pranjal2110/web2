import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide

    # Color Palette
    PRIMARY_BLUE = RGBColor(29, 78, 216)    # #1D4ED8 (SIH Header Blue)
    DARK_NAVY = RGBColor(15, 23, 42)        # #0F172A (Text Dark)
    ACCENT_AMBER = RGBColor(217, 119, 6)    # #D97706 (Amber highlight)
    ACCENT_GREEN = RGBColor(16, 185, 129)   # #10B981 (Success Emerald)
    BG_LIGHT = RGBColor(248, 250, 252)      # #F8FAFC (Card background)
    BORDER_COLOR = RGBColor(226, 232, 240)  # #E2E8F0
    WHITE = RGBColor(255, 255, 255)

    def add_header(slide, title_text="SMART INDIA HACKATHON"):
        # Top Header Bar Banner
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.8))
        tf = header_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_BLUE
        p.alignment = PP_ALIGN.LEFT

        # Small Sub-label
        p2 = tf.add_paragraph()
        p2.text = "Ministry of Education & AICTE Initiative"
        p2.font.size = Pt(11)
        p2.font.color.rgb = RGBColor(100, 116, 139)

    # =========================================================================
    # SLIDE 1: Title Slide (Matches the reference screenshot format)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    add_header(slide1, "SMART INDIA HACKATHON 2024")

    # Project Big Title (Centered)
    title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(1.3), Inches(11.7), Inches(0.9))
    tf1 = title_box.text_frame
    p = tf1.paragraphs[0]
    p.text = "Athenaeum"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = DARK_NAVY
    p.alignment = PP_ALIGN.CENTER

    sub_p = tf1.add_paragraph()
    sub_p.text = "Next-Generation Library Management & Automated Circulation System"
    sub_p.font.size = Pt(16)
    sub_p.font.color.rgb = ACCENT_AMBER
    sub_p.alignment = PP_ALIGN.CENTER

    # Left Column: Project Details (Exact reference layout from screenshot)
    left_box = slide1.shapes.add_textbox(Inches(0.8), Inches(2.4), Inches(7.2), Inches(4.5))
    ltf = left_box.text_frame
    ltf.word_wrap = True

    items = [
        ("Problem Statement ID", "SIH-EDU-1733"),
        ("Problem Statement Title", "Smart Library Catalogue, Circulation & Asset Management System with Real-Time Due Date & Automated Fine Engine"),
        ("Theme", "Education / Public Services"),
        ("PS Category", "Software"),
        ("Team ID", "34005"),
        ("Team Name", "Sarva-Conquerors")
    ]

    for label, val in items:
        p = ltf.add_paragraph()
        p.space_after = Pt(14)
        run_label = p.add_run()
        run_label.text = f"•  {label} – "
        run_label.font.bold = True
        run_label.font.size = Pt(16)
        run_label.font.color.rgb = DARK_NAVY

        run_val = p.add_run()
        run_val.text = val
        run_val.font.size = Pt(15)
        run_val.font.color.rgb = RGBColor(51, 65, 85)

    # Right Column: Visual Feature Highlights Card
    right_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.3), Inches(2.4), Inches(4.2), Inches(4.4))
    right_card.fill.solid()
    right_card.fill.fore_color.rgb = BG_LIGHT
    right_card.line.color.rgb = BORDER_COLOR
    right_card.line.width = Pt(1.5)

    rc_text = slide1.shapes.add_textbox(Inches(8.5), Inches(2.6), Inches(3.8), Inches(4.0))
    rtf = rc_text.text_frame
    rtf.word_wrap = True

    rp1 = rtf.paragraphs[0]
    rp1.text = "🏛️ Key Solution Highlights"
    rp1.font.bold = True
    rp1.font.size = Pt(18)
    rp1.font.color.rgb = PRIMARY_BLUE
    rp1.space_after = Pt(12)

    features = [
        "Role-Based Access (Librarians & Patrons)",
        "Zero-Copy & Borrow Quota Guardrails",
        "Automated Due Date & Overdue Fine Engine",
        "Real-Time Telemetry & Popularity Analytics",
        "Server-Side Rendered (Node + Express + EJS)",
        "Cloud Database (MongoDB Atlas) + Fallback"
    ]
    for feat in features:
        p = rtf.add_paragraph()
        p.text = f"✔ {feat}"
        p.font.size = Pt(13)
        p.font.color.rgb = DARK_NAVY
        p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 2: Problem Statement & Proposed Solution
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header(slide2)

    s2_title = slide2.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.6))
    p = s2_title.text_frame.paragraphs[0]
    p.text = "Problem Statement & Proposed Solution"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = DARK_NAVY

    # Left Card: The Problem
    card_prob = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    card_prob.fill.solid()
    card_prob.fill.fore_color.rgb = RGBColor(254, 242, 242) # subtle red tint
    card_prob.line.color.rgb = RGBColor(252, 165, 165)
    card_prob.line.width = Pt(1.5)

    tb_prob = slide2.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.5))
    tf = tb_prob.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "⚠️ Current Challenges in Libraries"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = RGBColor(185, 28, 28)
    p.space_after = Pt(14)

    prob_points = [
        ("Discrepancies in Inventory: ", "Manual or basic systems fail to track exact physical availability, leading to phantom issues."),
        ("No Strict Guardrails: ", "Patrons can borrow books that are out of stock, hoard multiple copies, or exceed per-member quotas."),
        ("Uncollected Overdue Fines: ", "Calculating fines manually based on late days is cumbersome, error-prone, and often overlooked."),
        ("Lack of Operational Telemetry: ", "Administrators lack actionable insights on most-borrowed disciplines, stock turnover, and patron behavior.")
    ]
    for b_title, b_desc in prob_points:
        p = tf.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = f"• {b_title}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # Right Card: Our Solution
    card_sol = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    card_sol.fill.solid()
    card_sol.fill.fore_color.rgb = RGBColor(240, 253, 244) # subtle green tint
    card_sol.line.color.rgb = RGBColor(134, 239, 172)
    card_sol.line.width = Pt(1.5)

    tb_sol = slide2.shapes.add_textbox(Inches(7.2), Inches(2.0), Inches(5.0), Inches(4.5))
    tf = tb_sol.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💡 Our Solution: Athenaeum"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = RGBColor(21, 128, 61)
    p.space_after = Pt(14)

    sol_points = [
        ("Full-Stack SSR Platform: ", "Built using Node.js, Express, EJS, and MongoDB Atlas for high speed, reliability, and security."),
        ("Multi-Layer Safety Guardrails: ", "Automatic rejection of 0-copy checkouts, enforcement of 3-book member limits, and duplicate loan prevention."),
        ("Dynamic Overdue Fine Engine: ", "Real-time calculation at $0.75/day with Time-Machine simulation (+3d, +7d, +15d) for instant verification."),
        ("Comprehensive Telemetry: ", "Interactive dashboard with physical utilization %, ranked popularity meters, and audit trails.")
    ]
    for b_title, b_desc in sol_points:
        p = tf.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = f"✔ {b_title}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # =========================================================================
    # SLIDE 3: Technical Architecture & Stack
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header(slide3)

    s3_title = slide3.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.6))
    p = s3_title.text_frame.paragraphs[0]
    p.text = "Technical Architecture & System Design"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = DARK_NAVY

    # 3 Architecture Tier Cards
    tiers = [
        ("Presentation Layer (SSR)", "EJS & Vanilla CSS", [
            "Server-Side Rendering for fast initial page load",
            "Responsive Dark/Light mode theme system",
            "Custom modals & flash feedback alerts",
            "SEO-friendly semantic HTML5 structure"
        ], Inches(0.8)),
        ("Application Layer", "Node.js & Express.js", [
            "RESTful route controllers (CRUD & circulation)",
            "Role authorization guards (Librarian vs Member)",
            "Bcrypt password hashing (Salt rounds 10)",
            "Session management with connect-mongo"
        ], Inches(4.85)),
        ("Database & Persistence", "MongoDB Atlas + In-Memory", [
            "Mongoose Schemas (User, Book, Loan, Log)",
            "Text search index on title, author, ISBN",
            "MongoDB Atlas cloud persistence",
            "Embedded in-memory fallback for zero-crash deploy"
        ], Inches(8.9))
    ]

    for title, subtitle, bullets, left_pos in tiers:
        card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.8), Inches(3.65), Inches(5.0))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_LIGHT
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        tb = slide3.shapes.add_textbox(left_pos + Inches(0.2), Inches(2.0), Inches(3.25), Inches(4.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.bold = True
        p1.font.size = Pt(16)
        p1.font.color.rgb = PRIMARY_BLUE

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.bold = True
        p2.font.size = Pt(13)
        p2.font.color.rgb = ACCENT_AMBER
        p2.space_after = Pt(12)

        for b in bullets:
            bp = tf.add_paragraph()
            bp.text = f"• {b}"
            bp.font.size = Pt(12)
            bp.font.color.rgb = DARK_NAVY
            bp.space_after = Pt(8)

    # =========================================================================
    # SLIDE 4: Core Features & The 3 Strict Guardrails
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header(slide4)

    s4_title = slide4.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.6))
    p = s4_title.text_frame.paragraphs[0]
    p.text = "Core Features & Strict Business Logic Guardrails"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = DARK_NAVY

    # Left: Core Features Table/Card
    left_c = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    left_c.fill.solid()
    left_c.fill.fore_color.rgb = BG_LIGHT
    left_c.line.color.rgb = BORDER_COLOR

    ltb = slide4.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf = ltb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📋 Core Operational Features"
    p.font.bold = True
    p.font.size = Pt(17)
    p.font.color.rgb = PRIMARY_BLUE
    p.space_after = Pt(10)

    features_list = [
        ("Role-Based Access: ", "Librarian administration dashboard vs Member self-service portal ('My Loans')."),
        ("Librarian Book CRUD: ", "Full catalogue management with Title, Author, ISBN, Category, Total Copies & Shelf Locations."),
        ("Multi-Filter Search: ", "Search by keyword across title/author/ISBN, filter by discipline and shelf availability."),
        ("Automated Issue & Return: ", "Auto-decrements available copies on checkout and auto-increments upon book return.")
    ]
    for ft, fd in features_list:
        p = tf.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"• {ft}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = fd
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # Right: The 3 Mandatory Guardrails
    right_c = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    right_c.fill.solid()
    right_c.fill.fore_color.rgb = RGBColor(254, 243, 199) # subtle amber tint
    right_c.line.color.rgb = RGBColor(245, 158, 11)
    right_c.line.width = Pt(1.5)

    rtb = slide4.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.2), Inches(4.5))
    tf = rtb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "🛡️ The 3 Mandatory Safety Guardrails"
    p.font.bold = True
    p.font.size = Pt(17)
    p.font.color.rgb = RGBColor(180, 83, 9)
    p.space_after = Pt(12)

    guards = [
        ("1. Zero Available Copies Guard: ", "Strictly prevents issuing a book when availableCopies <= 0. System displays clear out-of-stock badge."),
        ("2. Per-Member Borrowing Quota: ", "Enforces strict limits (default max 3 books per patron). Prevents checkouts once active loans reach quota."),
        ("3. Duplicate Checkout Prevention: ", "Rejects issuing a second physical copy of the exact same title to the same patron while one is still active."),
        ("4. Delete Protection Guardrail: ", "Librarians cannot delete catalogue titles that currently have active checked-out copies with patrons.")
    ]
    for gt, gd in guards:
        p = tf.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"✔ {gt}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = gd
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # =========================================================================
    # SLIDE 5: Stretch Goal & Innovation (Fine Engine & Telemetry)
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header(slide5)

    s5_title = slide5.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.6))
    p = s5_title.text_frame.paragraphs[0]
    p.text = "Stretch Goal & Innovation: Automated Fine Engine & Telemetry"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = DARK_NAVY

    # Left: Fine Engine & Time Travel Card
    left_c = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    left_c.fill.solid()
    left_c.fill.fore_color.rgb = BG_LIGHT
    left_c.line.color.rgb = BORDER_COLOR

    ltb = slide5.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf = ltb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "💰 Automated Overdue Fine Engine"
    p.font.bold = True
    p.font.size = Pt(17)
    p.font.color.rgb = PRIMARY_BLUE
    p.space_after = Pt(10)

    fine_points = [
        ("Formula: ", "Fine = (Days Overdue) × $0.75 / day. Automatically calculated against simulated date."),
        ("Time Machine Feature: ", "Header controls allow fast-forwarding simulation (+3d, +7d, +15d) to immediately test overdue transitions."),
        ("Fine Settlement Workflow: ", "Supports full cash collection (updates patron payment ledger) and librarian staff waiving."),
        ("Active Reminders: ", "Overdue loans display distinct red alert badges on both Circulation Desk and Patron 'My Loans' portal.")
    ]
    for ft, fd in fine_points:
        p = tf.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"• {ft}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = fd
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # Right: Dashboard Analytics & KPIs
    right_c = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    right_c.fill.solid()
    right_c.fill.fore_color.rgb = BG_LIGHT
    right_c.line.color.rgb = BORDER_COLOR

    rtb = slide5.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.2), Inches(4.5))
    tf = rtb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "📊 Real-Time Analytics & Telemetry"
    p.font.bold = True
    p.font.size = Pt(17)
    p.font.color.rgb = PRIMARY_BLUE
    p.space_after = Pt(10)

    analytics_points = [
        ("Key Performance Indicators (KPIs): ", "Live counters for Total Titles, Physical Copies, Active Loans, Overdue Books, and Fines."),
        ("Most-Borrowed Titles Ranking: ", "Visual popularity leaderboard dynamically ranked by lifetime checkout frequency."),
        ("Discipline Distribution: ", "Proportional breakdown across Computer Science, Literature, Philosophy, and Science."),
        ("System Audit Log: ", "Chronological history trail logging all issues, returns, inventory updates, and fine waivers.")
    ]
    for at, ad in analytics_points:
        p = tf.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"• {at}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = ad
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # =========================================================================
    # SLIDE 6: Verification, Testing & Feasibility
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header(slide6)

    s6_title = slide6.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.6))
    p = s6_title.text_frame.paragraphs[0]
    p.text = "Testing, Verification & Future Scope"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = DARK_NAVY

    # Left: Test Verification Card
    left_c = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    left_c.fill.solid()
    left_c.fill.fore_color.rgb = RGBColor(240, 253, 244)
    left_c.line.color.rgb = RGBColor(134, 239, 172)

    ltb = slide6.shapes.add_textbox(Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5))
    tf = ltb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "🧪 100% Automated Test Coverage"
    p.font.bold = True
    p.font.size = Pt(17)
    p.font.color.rgb = RGBColor(21, 128, 61)
    p.space_after = Pt(10)

    test_points = [
        ("21 / 21 Assertions Passing: ", "Full test suite in tests/circulation.test.js covers seeding, borrow guards, and fine math."),
        ("Zero Copies Guard Test: ", "Verified Clean Code (0 copies) checkout is rejected."),
        ("Quota Limit Test: ", "Verified Alex Rivera (3 books max) 4th borrow is blocked."),
        ("Return Inventory Test: ", "Verified available copies automatically increment back to shelf count on return."),
        ("Time-Travel Fine Test: ", "Verified exact mathematical calculation of fines across multiple overdue loans.")
    ]
    for tt, td in test_points:
        p = tf.add_paragraph()
        p.space_after = Pt(7)
        r1 = p.add_run()
        r1.text = f"✔ {tt}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = td
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    # Right: Future Enhancements & Feasibility
    right_c = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.8), Inches(5.6), Inches(5.0))
    right_c.fill.solid()
    right_c.fill.fore_color.rgb = BG_LIGHT
    right_c.line.color.rgb = BORDER_COLOR

    rtb = slide6.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.2), Inches(4.5))
    tf = rtb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "🚀 Feasibility & Future Roadmap"
    p.font.bold = True
    p.font.size = Pt(17)
    p.font.color.rgb = PRIMARY_BLUE
    p.space_after = Pt(10)

    future_points = [
        ("Zero-Crash Deployment: ", "Features automatic in-memory MongoDB fallback for instant cloud hosting on Render.com."),
        ("RFID & Barcode Integration: ", "Add optical barcode and RFID tag scanning for contactless checkout."),
        ("Automated Patron Notifications: ", "SMS & WhatsApp alerts 48 hours prior to due dates to reduce overdue rates."),
        ("Multi-Branch Networking: ", "Inter-library loan protocol enabling book transfers across university departments.")
    ]
    for ft, fd in future_points:
        p = tf.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = f"• {ft}"
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = DARK_NAVY
        r2 = p.add_run()
        r2.text = fd
        r2.font.size = Pt(12)
        r2.font.color.rgb = RGBColor(71, 85, 105)

    output_path = "Athenaeum_SIH_Presentation.pptx"
    prs.save(output_path)
    print(f"✅ Successfully generated PowerPoint presentation: {output_path}")

if __name__ == '__main__':
    create_presentation()
