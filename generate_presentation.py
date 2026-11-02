import sys
import os
import qrcode
import pptx
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def ensure_qr_code(qr_path):
    qr = qrcode.QRCode(box_size=12, border=2)
    qr.add_data("https://veggity.vercel.app/home")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(qr_path)
    print(f"QR code generated at: {qr_path}")

def create_deck(output_path, qr_image_path):
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette Definitions (Natural / Fresh Produce / Modern)
    COLOR_BG = RGBColor(246, 248, 245)          # Soft Sage Off-White
    COLOR_DARK_GREEN = RGBColor(20, 83, 45)      # Deep Forest Green (#14532D)
    COLOR_MID_GREEN = RGBColor(22, 163, 74)      # Vibrant Leaf Green (#16A34A)
    COLOR_LIGHT_MINT = RGBColor(236, 253, 245)   # Mint Light Tint (#ECFDF5)
    COLOR_CARD_BG = RGBColor(255, 255, 255)      # Pure White Card
    COLOR_TEXT_MAIN = RGBColor(15, 23, 42)       # Slate 900
    COLOR_TEXT_MUTED = RGBColor(71, 85, 105)     # Slate 600
    COLOR_TEXT_LIGHT = RGBColor(100, 116, 139)   # Slate 500
    COLOR_BORDER = RGBColor(226, 232, 240)       # Slate 200 Border
    COLOR_BORDER_GREEN = RGBColor(167, 243, 208) # Emerald Border
    COLOR_AMBER = RGBColor(217, 119, 6)          # Amber 600
    COLOR_AMBER_BG = RGBColor(254, 243, 199)     # Amber 100
    COLOR_ROSE_BG = RGBColor(255, 241, 242)      # Rose 50
    COLOR_ROSE_TEXT = RGBColor(225, 29, 72)      # Rose 600
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_CHIP_BG = RGBColor(241, 245, 249)      # Slate 100

    FONT_FAMILY = "Segoe UI"
    FONT_TITLE = "Segoe UI"
    TOTAL_SLIDES = 9

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        slide.shapes._spTree.remove(bg._element)
        slide.shapes._spTree.insert(2, bg._element)
        return bg

    def add_header(slide, kicker, title, subtitle):
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.42), Inches(11.733), Inches(1.1))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p_kicker = tf.paragraphs[0]
        p_kicker.text = kicker.upper()
        p_kicker.font.name = FONT_FAMILY
        p_kicker.font.size = Pt(10)
        p_kicker.font.bold = True
        p_kicker.font.color.rgb = COLOR_MID_GREEN
        p_kicker.space_after = Pt(2)

        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.name = FONT_TITLE
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_DARK_GREEN
        p_title.space_after = Pt(2)

        p_sub = tf.add_paragraph()
        p_sub.text = subtitle
        p_sub.font.name = FONT_FAMILY
        p_sub.font.size = Pt(12)
        p_sub.font.color.rgb = COLOR_TEXT_MUTED

    def add_footer(slide, slide_num):
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.015))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_BORDER
        line.line.fill.background()

        tb = slide.shapes.add_textbox(Inches(0.8), Inches(7.08), Inches(9.0), Inches(0.35))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = "VEGGITY  •  Hyperlocal Fresh Produce Marketplace   |   veggity.vercel.app/home"
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_TEXT_LIGHT

        tb_num = slide.shapes.add_textbox(Inches(10.0), Inches(7.08), Inches(2.533), Inches(0.35))
        tf_num = tb_num.text_frame
        tf_num.margin_left = tf_num.margin_top = tf_num.margin_right = tf_num.margin_bottom = 0
        p_num = tf_num.paragraphs[0]
        p_num.text = f"Slide {slide_num} of {TOTAL_SLIDES}"
        p_num.alignment = PP_ALIGN.RIGHT
        p_num.font.name = FONT_FAMILY
        p_num.font.size = Pt(9.5)
        p_num.font.bold = True
        p_num.font.color.rgb = COLOR_TEXT_LIGHT

    def create_card(slide, left, top, width, height, bg_color=COLOR_CARD_BG, border_color=COLOR_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    def add_badge(slide, left, top, width, height, text, bg_color=COLOR_LIGHT_MINT, text_color=COLOR_DARK_GREEN):
        b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        b.fill.solid()
        b.fill.fore_color.rgb = bg_color
        b.line.fill.background()
        tf = b.text_frame
        tf.word_wrap = False
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_FAMILY
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = text_color
        return b

    # =========================================================================
    # SLIDE 1: Title Slide (Hero + Live Demo QR Code)
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide1, COLOR_DARK_GREEN)

    deco = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.7), Inches(11.733), Inches(6.1))
    deco.fill.solid()
    deco.fill.fore_color.rgb = RGBColor(24, 94, 52)
    deco.line.color.rgb = RGBColor(38, 138, 77)
    deco.line.width = Pt(1.5)

    tbox = slide1.shapes.add_textbox(Inches(1.3), Inches(1.2), Inches(7.2), Inches(4.8))
    tf = tbox.text_frame
    tf.word_wrap = True

    p_badge = tf.paragraphs[0]
    p_badge.text = "🌱  HYPERLOCAL FRESH PRODUCE MARKETPLACE"
    p_badge.font.name = FONT_FAMILY
    p_badge.font.size = Pt(11)
    p_badge.font.bold = True
    p_badge.font.color.rgb = RGBColor(187, 247, 208)
    p_badge.space_after = Pt(10)

    p_title = tf.add_paragraph()
    p_title.text = "VEGGITY"
    p_title.font.name = FONT_TITLE
    p_title.font.size = Pt(56)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_WHITE
    p_title.space_after = Pt(6)

    p_tagline = tf.add_paragraph()
    p_tagline.text = "Hyperlocal Fresh Garden Produce"
    p_tagline.font.name = FONT_FAMILY
    p_tagline.font.size = Pt(22)
    p_tagline.font.bold = True
    p_tagline.font.color.rgb = RGBColor(220, 252, 231)
    p_tagline.space_after = Pt(14)

    p_desc = tf.add_paragraph()
    p_desc.text = "A neighborhood platform helping home gardeners and small farmers sell surplus harvest directly to nearby buyers at fair prices—earning extra income while providing fresh, affordable food locally."
    p_desc.font.name = FONT_FAMILY
    p_desc.font.size = Pt(13)
    p_desc.font.color.rgb = RGBColor(240, 253, 244)
    p_desc.space_after = Pt(20)

    p_meta = tf.add_paragraph()
    p_meta.text = "⚡ Stack: React 19 • Express 5 • MongoDB Atlas (2dsphere)   |   Live on Vercel"
    p_meta.font.name = FONT_FAMILY
    p_meta.font.size = Pt(11)
    p_meta.font.bold = True
    p_meta.font.color.rgb = RGBColor(187, 247, 208)

    # Right Card: Interactive QR Code Container
    qr_card_left = Inches(8.9)
    qr_card_top = Inches(1.2)
    qr_card_w = Inches(3.2)
    qr_card_h = Inches(5.1)

    qr_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, qr_card_left, qr_card_top, qr_card_w, qr_card_h)
    qr_card.fill.solid()
    qr_card.fill.fore_color.rgb = COLOR_WHITE
    qr_card.line.color.rgb = RGBColor(187, 247, 208)
    qr_card.line.width = Pt(1.5)

    qr_tb = slide1.shapes.add_textbox(qr_card_left + Inches(0.2), qr_card_top + Inches(0.2), qr_card_w - Inches(0.4), Inches(0.85))
    qr_tf = qr_tb.text_frame
    qr_tf.word_wrap = True
    qr_tf.margin_left = qr_tf.margin_top = qr_tf.margin_right = qr_tf.margin_bottom = 0

    qp1 = qr_tf.paragraphs[0]
    qp1.alignment = PP_ALIGN.CENTER
    qp1.text = "SCAN TO OPEN APP"
    qp1.font.name = FONT_FAMILY
    qp1.font.size = Pt(12)
    qp1.font.bold = True
    qp1.font.color.rgb = COLOR_DARK_GREEN

    qp2 = qr_tf.add_paragraph()
    qp2.alignment = PP_ALIGN.CENTER
    qp2.text = "Test live deployment instantly"
    qp2.font.name = FONT_FAMILY
    qp2.font.size = Pt(9.5)
    qp2.font.color.rgb = COLOR_TEXT_MUTED

    if os.path.exists(qr_image_path):
        slide1.shapes.add_picture(qr_image_path, qr_card_left + Inches(0.4), qr_card_top + Inches(1.05), Inches(2.4), Inches(2.4))

    qr_fb = slide1.shapes.add_textbox(qr_card_left + Inches(0.2), qr_card_top + Inches(3.6), qr_card_w - Inches(0.4), Inches(1.3))
    qr_ftf = qr_fb.text_frame
    qr_ftf.word_wrap = True
    qr_ftf.margin_left = qr_ftf.margin_top = qr_ftf.margin_right = qr_ftf.margin_bottom = 0

    qfp1 = qr_ftf.paragraphs[0]
    qfp1.alignment = PP_ALIGN.CENTER
    qfp1.text = "veggity.vercel.app/home"
    qfp1.font.name = FONT_FAMILY
    qfp1.font.size = Pt(10)
    qfp1.font.bold = True
    qfp1.font.color.rgb = COLOR_MID_GREEN
    qfp1.space_after = Pt(6)

    qfp2 = qr_ftf.add_paragraph()
    qfp2.alignment = PP_ALIGN.CENTER
    qfp2.text = "📱 Scan with any phone camera to explore nearby produce & test login"
    qfp2.font.name = FONT_FAMILY
    qfp2.font.size = Pt(9)
    qfp2.font.color.rgb = COLOR_TEXT_MUTED

    # =========================================================================
    # SLIDE 2: Introduction and Purpose
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide2, COLOR_BG)
    add_header(slide2, "01 • Introduction & Purpose", "What is Veggity?", "A neighborhood exchange connecting local growers directly with nearby buyers.")
    add_footer(slide2, 2)

    card_w = Inches(5.72)
    card_h = Inches(5.15)
    c_top = Inches(1.65)

    create_card(slide2, Inches(0.8), c_top, card_w, card_h, border_color=COLOR_BORDER_GREEN)
    tb_left = slide2.shapes.add_textbox(Inches(1.1), c_top + Inches(0.3), card_w - Inches(0.6), card_h - Inches(0.6))
    tfl = tb_left.text_frame
    tfl.word_wrap = True
    tfl.margin_left = tfl.margin_top = tfl.margin_right = tfl.margin_bottom = 0

    p = tfl.paragraphs[0]
    p.text = "🌿  WHAT IS THE PLATFORM?"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK_GREEN
    p.space_after = Pt(6)

    p = tfl.add_paragraph()
    p.text = "Veggity is a location-aware web marketplace that helps home gardeners and small growers list their extra produce so nearby neighbors can easily find and buy it fresh."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(18)

    p = tfl.add_paragraph()
    p.text = "👥  DESIGNED FOR THREE GROUPS:"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK_GREEN
    p.space_after = Pt(10)

    users = [
        ("Home Gardeners", "Sell extra yield from kitchen gardens, planters, and fruit trees."),
        ("Small Local Farmers", "Direct customer reach without needing commercial mandi contracts."),
        ("Nearby Buyers", "Access fresh homegrown produce at fair, affordable prices.")
    ]
    for u_title, u_desc in users:
        pb = tfl.add_paragraph()
        pb.text = f"• {u_title}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(11.5)
        pb.font.bold = True
        pb.font.color.rgb = COLOR_TEXT_MAIN
        
        run = pb.add_run()
        run.text = u_desc
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT_MUTED
        pb.space_after = Pt(8)

    add_badge(slide2, Inches(1.1), c_top + Inches(4.45), card_w - Inches(0.6), Inches(0.38),
              "📍 Discovery locked to a local 5km–10km neighborhood radius",
              COLOR_LIGHT_MINT, COLOR_DARK_GREEN)

    create_card(slide2, Inches(6.81), c_top, card_w, card_h, border_color=COLOR_BORDER_GREEN)
    tb_right = slide2.shapes.add_textbox(Inches(7.11), c_top + Inches(0.3), card_w - Inches(0.6), card_h - Inches(0.6))
    tfr = tb_right.text_frame
    tfr.word_wrap = True
    tfr.margin_left = tfr.margin_top = tfr.margin_right = tfr.margin_bottom = 0

    p = tfr.paragraphs[0]
    p.text = "🎯  WHY WAS IT CREATED?"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK_GREEN
    p.space_after = Pt(6)

    p = tfr.add_paragraph()
    p.text = "When home gardeners have extra produce, they often struggle to find immediate buyers and end up selling at throwaway prices or preserving it. Veggity creates a direct market."
    p.font.name = FONT_FAMILY
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_TEXT_MUTED
    p.space_after = Pt(18)

    p = tfr.add_paragraph()
    p.text = "🎯  CORE OBJECTIVES:"
    p.font.name = FONT_FAMILY
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = COLOR_DARK_GREEN
    p.space_after = Pt(10)

    objectives = [
        ("Extra Income for Sellers", "Help home growers easily monetize their surplus harvest."),
        ("Affordable Fresh Produce", "Enable buyers to purchase fresh food 20–40% cheaper than stores."),
        ("Convenient Local Discovery", "Make nearby homegrown food visible on an interactive map."),
        ("Encourage Local Growing", "Promote sustainable, chemical-free community food sharing.")
    ]
    for o_head, o_desc in objectives:
        pb = tfr.add_paragraph()
        pb.text = f"✔ {o_head}: "
        pb.font.name = FONT_FAMILY
        pb.font.size = Pt(11.5)
        pb.font.bold = True
        pb.font.color.rgb = COLOR_MID_GREEN

        run = pb.add_run()
        run.text = o_desc
        run.font.bold = False
        run.font.color.rgb = COLOR_TEXT_MUTED
        pb.space_after = Pt(8)

    add_badge(slide2, Inches(7.11), c_top + Inches(4.45), card_w - Inches(0.6), Inches(0.38),
              "🤝 Win-Win: Sellers earn extra money • Buyers save money on fresh food",
              COLOR_AMBER_BG, COLOR_AMBER)

    # =========================================================================
    # SLIDE 3: Problem Statement
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide3, COLOR_BG)
    add_header(slide3, "02 • Problem Statement", "The Challenges Home Gardeners & Buyers Face", "Small growers struggle to sell surplus while consumers pay high prices for older store produce.")
    add_footer(slide3, 3)

    grid_w = Inches(5.72)
    grid_h = Inches(2.42)
    gap_x = Inches(0.29)
    gap_y = Inches(0.25)
    top_row_y = Inches(1.68)
    bot_row_y = top_row_y + grid_h + gap_y

    problems = [
        ("📉", "Hard to Find Immediate Buyers", 
         "Gardeners harvest more vegetables, lemons, or chillies than their families can eat. Without a quick way to reach neighbors, they are forced to sell at throwaway distress prices or preserve it.",
         "Challenge: No fast, local marketplace for surplus", COLOR_AMBER_BG, COLOR_AMBER),
        ("📢", "No Platform for Small Quantities", 
         "Commercial agricultural mandis and supermarkets only buy in large bulk volumes. Home gardeners with 2–5 kg of surplus produce have nowhere to list their harvest.",
         "Barrier: Lack of micro-selling channels", COLOR_CARD_BG, COLOR_MID_GREEN),
        ("⏱", "Freshness is Time-Sensitive", 
         "Harvested greens and vegetables have peak flavor and nutrition in the first 24 to 48 hours. Without instant discovery, the produce quickly loses crispness.",
         "Window: Freshness degrades within 24–48 hours", COLOR_CARD_BG, COLOR_MID_GREEN),
        ("💸", "High Grocery Store Prices", 
         "Consumers pay inflated prices in supermarkets for produce that was trucked from far away and stored for days, while fresher food grown 2 km away remains unnoticed.",
         "Inefficiency: High retail markups for older produce", COLOR_CARD_BG, COLOR_MID_GREEN)
    ]

    coords = [
        (Inches(0.8), top_row_y),
        (Inches(0.8) + grid_w + gap_x, top_row_y),
        (Inches(0.8), bot_row_y),
        (Inches(0.8) + grid_w + gap_x, bot_row_y)
    ]

    for (icon, title, desc, stat, bg, border_col), (c_x, c_y) in zip(problems, coords):
        create_card(slide3, c_x, c_y, grid_w, grid_h, bg, COLOR_BORDER)
        tb = slide3.shapes.add_textbox(c_x + Inches(0.28), c_y + Inches(0.2), grid_w - Inches(0.56), grid_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {title}"
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN
        p1.space_after = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.line_spacing = 1.15
        p2.space_after = Pt(10)

        p3 = tf.add_paragraph()
        p3.text = f"• {stat}"
        p3.font.name = FONT_FAMILY
        p3.font.size = Pt(10)
        p3.font.bold = True
        p3.font.color.rgb = border_col

    # =========================================================================
    # SLIDE 4: Proposed Solution
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide4, COLOR_BG)
    add_header(slide4, "03 • Proposed Solution", "The Veggity Solution: Connecting Local Supply & Demand", "A direct, neighborhood pipeline making fresh food accessible and easy to sell.")
    add_footer(slide4, 4)

    flow_step_w = Inches(3.7)
    flow_step_h = Inches(1.8)
    flow_gap = Inches(0.31)
    flow_top = Inches(1.68)

    steps = [
        ("1. List Surplus Produce", "🌱 Seller Workflow", 
         "Grower lists surplus crops with quantity, fair price, category, and automatic GPS location in seconds."),
        ("2. Proximity Discovery", "⚡ Veggity Engine", 
         "Platform displays available produce to nearby neighbors within 5–10 km and auto-filters expired items."),
        ("3. Convenient Purchase", "🧺 Buyer Workflow", 
         "Neighbors discover local listings, inspect freshness badges, and add produce to cart at lower prices.")
    ]

    for i, (s_title, s_role, s_desc) in enumerate(steps):
        s_left = Inches(0.8) + i * (flow_step_w + flow_gap)
        create_card(slide4, s_left, flow_top, flow_step_w, flow_step_h, COLOR_CARD_BG, COLOR_BORDER_GREEN)
        tb = slide4.shapes.add_textbox(s_left + Inches(0.2), flow_top + Inches(0.18), flow_step_w - Inches(0.4), flow_step_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = s_title
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN
        p1.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = s_role
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_MID_GREEN
        p2.space_after = Pt(4)

        p3 = tf.add_paragraph()
        p3.text = s_desc
        p3.font.name = FONT_FAMILY
        p3.font.size = Pt(10.5)
        p3.font.color.rgb = COLOR_TEXT_MUTED

    bot_card_w = Inches(3.7)
    bot_card_h = Inches(3.05)
    bot_top = Inches(3.75)

    triples = [
        ("💰  FOR SELLERS", "Monetize Garden Surplus", [
            "Earn extra income from extra harvest.",
            "No middleman fees or bulk requirements.",
            "Sell fresh produce before it perishes."
        ], "Outcome: Extra household income", RGBColor(240, 253, 244), COLOR_BORDER_GREEN),
        ("🥗  FOR BUYERS", "Peak Freshness & Savings", [
            "Get produce picked hours ago, not stored for days.",
            "Save 20% to 40% compared to supermarket rates.",
            "Know your neighbor and food origin."
        ], "Outcome: 20-40% savings & peak freshness", COLOR_CARD_BG, COLOR_BORDER),
        ("🤝  FOR NEIGHBORHOODS", "Community Food Network", [
            "Encourages sharing and local buying.",
            "Near-zero food miles & vehicle transit.",
            "Strengthens local community self-reliance."
        ], "Outcome: Connected local community", RGBColor(240, 253, 244), COLOR_BORDER_GREEN)
    ]

    for i, (p_tag, p_head, p_items, p_chip, bg, border) in enumerate(triples):
        c_left = Inches(0.8) + i * (bot_card_w + flow_gap)
        create_card(slide4, c_left, bot_top, bot_card_w, bot_card_h, bg, border)
        tb = slide4.shapes.add_textbox(c_left + Inches(0.22), bot_top + Inches(0.18), bot_card_w - Inches(0.44), bot_card_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = p_tag
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN
        p1.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = p_head
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(12.5)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_TEXT_MAIN
        p2.space_after = Pt(8)

        for item in p_items:
            pi = tf.add_paragraph()
            pi.text = f"✔  {item}"
            pi.font.name = FONT_FAMILY
            pi.font.size = Pt(10.5)
            pi.font.color.rgb = COLOR_TEXT_MUTED
            pi.space_after = Pt(5)

        p_meta = tf.add_paragraph()
        p_meta.text = f"🎯 {p_chip}"
        p_meta.font.name = FONT_FAMILY
        p_meta.font.size = Pt(9.5)
        p_meta.font.bold = True
        p_meta.font.color.rgb = COLOR_MID_GREEN

    # =========================================================================
    # SLIDE 5: Technology Stack
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide5, COLOR_BG)
    add_header(slide5, "04 • Technology Stack", "Technologies Actually Used in Veggity", "Clean, production-tested MERN architecture built for speed and proximity discovery.")
    add_footer(slide5, 5)

    col_w = Inches(2.76)
    col_gap = Inches(0.23)
    col_h = Inches(5.15)
    col_top = Inches(1.65)

    tech_columns = [
        ("⚛  FRONTEND", "React 19 & Vite", [
            ("React 19", "Dynamic UI and marketplace components."),
            ("Vite 8", "High-speed bundling and development."),
            ("React Router 7", "Client-side page navigation."),
            ("React Toastify", "Clean popup alerts for cart and auth.")
        ], "Role: Client Web App", COLOR_CARD_BG, COLOR_BORDER),
        ("🗺  LOCATION & MAPS", "Geospatial Tools", [
            ("Leaflet.js", "Interactive map on the home page."),
            ("HTML5 Geolocation", "One-click device GPS coordinate capture."),
            ("OpenStreetMap", "Free community map tiles."),
            ("Nominatim API", "Resolves area names to coordinates.")
        ], "Role: Proximity Engine", RGBColor(240, 253, 244), COLOR_BORDER_GREEN),
        ("🟢  BACKEND", "Node.js & Express", [
            ("Express.js 5", "REST API routes and request handling."),
            ("JWT Auth", "Token-based user session security."),
            ("Bcrypt", "Secure salted password hashing."),
            ("Joi Validation", "Input sanitization and validation.")
        ], "Role: API & Security", COLOR_CARD_BG, COLOR_BORDER),
        ("🍃  DATABASE & CLOUD", "MongoDB & Hosting", [
            ("MongoDB Atlas", "Cloud database storing listings."),
            ("2dsphere Index", "Fast spherical distance calculations."),
            ("Vercel", "Frontend hosting with continuous deploy."),
            ("Render.com", "24/7 backend cloud API service.")
        ], "Role: Data & Cloud Host", RGBColor(240, 253, 244), COLOR_BORDER_GREEN)
    ]

    for i, (tag, subtitle, items, col_role, bg, border) in enumerate(tech_columns):
        c_left = Inches(0.8) + i * (col_w + col_gap)
        create_card(slide5, c_left, col_top, col_w, col_h, bg, border)
        tb = slide5.shapes.add_textbox(c_left + Inches(0.18), col_top + Inches(0.2), col_w - Inches(0.36), col_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN
        p1.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_TEXT_MAIN
        p2.space_after = Pt(14)

        for name, desc in items:
            pn = tf.add_paragraph()
            pn.text = f"• {name}"
            pn.font.name = FONT_FAMILY
            pn.font.size = Pt(11)
            pn.font.bold = True
            pn.font.color.rgb = COLOR_MID_GREEN
            pn.space_after = Pt(1)

            pd = tf.add_paragraph()
            pd.text = desc
            pd.font.name = FONT_FAMILY
            pd.font.size = Pt(10)
            pd.font.color.rgb = COLOR_TEXT_MUTED
            pd.space_after = Pt(10)

        add_badge(slide5, c_left + Inches(0.18), col_top + Inches(4.55), col_w - Inches(0.36), Inches(0.35),
                  col_role, COLOR_LIGHT_MINT if "244" in str(bg) else COLOR_CHIP_BG, COLOR_DARK_GREEN)

    # =========================================================================
    # SLIDE 6: How the Platform Works
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide6, COLOR_BG)
    add_header(slide6, "05 • How the Platform Works", "User Journey: From Garden to Neighbor", "A straightforward 5-step process connecting sellers and buyers.")
    add_footer(slide6, 6)

    step5_w = Inches(2.21)
    step5_gap = Inches(0.17)
    step5_h = Inches(5.15)
    step5_top = Inches(1.65)

    flow_steps = [
        ("STEP 1", "🌱", "Seller Lists Produce", "Seller Action",
         "Opens /add-produce, enters vegetable name, quantity, category, price, and auto-detects GPS coordinates.",
         "UI: AddProduce.jsx", "Auth: JWT Protected"),
        ("STEP 2", "🛰", "Calculates Expiry", "Backend Automation",
         "OpenStreetMap converts location to GeoJSON [Lng, Lat]. System automatically sets expiresAt timestamp.",
         "GeoJSON Point", "2dsphere Index"),
        ("STEP 3", "🔍", "Buyer Sets Radius", "Nearby Search",
         "Buyer visits /home, enters their area or clicks detect, and picks radius (5 km, 10 km, or 20 km).",
         "UI: Home.jsx", "Leaflet Maps"),
        ("STEP 4", "⏱", "Freshness Filtering", "Automatic Quality",
         "Database queries produce within radius and automatically hides any item where expiresAt has passed.",
         "Auto-Eviction", "100% Fresh Only"),
        ("STEP 5", "🧺", "Cart & Order", "Direct Connection",
         "Buyer reviews freshness badge, adds produce to Cart Drawer, and completes order request with seller.",
         "UI: CartDrawer.jsx", "Local Pickup")
    ]

    for i, (stage, icon, title, role, desc, meta1, meta2) in enumerate(flow_steps):
        s_left = Inches(0.8) + i * (step5_w + step5_gap)
        is_highlight = (i == 3)
        bg = RGBColor(240, 253, 244) if is_highlight else COLOR_CARD_BG
        border = COLOR_BORDER_GREEN if is_highlight else COLOR_BORDER

        create_card(slide6, s_left, step5_top, step5_w, step5_h, bg, border)
        tb = slide6.shapes.add_textbox(s_left + Inches(0.14), step5_top + Inches(0.18), step5_w - Inches(0.28), step5_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = stage
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_MID_GREEN
        p1.space_after = Pt(2)

        p_ic = tf.add_paragraph()
        p_ic.text = icon
        p_ic.font.size = Pt(22)
        p_ic.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = title
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(12)
        p2.font.bold = True
        p2.font.color.rgb = COLOR_DARK_GREEN
        p2.space_after = Pt(2)

        p3 = tf.add_paragraph()
        p3.text = role
        p3.font.name = FONT_FAMILY
        p3.font.size = Pt(9.5)
        p3.font.bold = True
        p3.font.color.rgb = COLOR_TEXT_MUTED
        p3.space_after = Pt(8)

        p4 = tf.add_paragraph()
        p4.text = desc
        p4.font.name = FONT_FAMILY
        p4.font.size = Pt(10)
        p4.font.color.rgb = COLOR_TEXT_MUTED
        p4.line_spacing = 1.15
        p4.space_after = Pt(14)

        add_badge(slide6, s_left + Inches(0.12), step5_top + Inches(4.15), step5_w - Inches(0.24), Inches(0.32),
                  meta1, COLOR_LIGHT_MINT if is_highlight else COLOR_CHIP_BG, COLOR_DARK_GREEN)
        add_badge(slide6, s_left + Inches(0.12), step5_top + Inches(4.55), step5_w - Inches(0.24), Inches(0.32),
                  meta2, COLOR_LIGHT_MINT if is_highlight else COLOR_CHIP_BG, COLOR_MID_GREEN)

    # =========================================================================
    # SLIDE 7: Main Features
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide7, COLOR_BG)
    add_header(slide7, "06 • Main Features", "Key Features Implemented in the Project", "Core functional capabilities already built and active in the live application.")
    add_footer(slide7, 7)

    feat_w = Inches(3.75)
    feat_h = Inches(2.42)
    feat_gap_x = Inches(0.24)
    feat_gap_y = Inches(0.25)
    f_top1 = Inches(1.68)
    f_top2 = f_top1 + feat_h + feat_gap_y

    features = [
        ("📍", "Hyperlocal Proximity Search", 
         "MongoDB 2dsphere indexing filters produce by straight-line distance, showing only listings within 5km, 10km, or 20km.",
         "Tech: MongoDB $near & $maxDistance", COLOR_LIGHT_MINT, COLOR_DARK_GREEN),
        ("⏱", "Automated Freshness Expiry", 
         "Enforces safety caps (leafy 2d, soft 4d, roots 15d). Expired produce vanishes automatically with zero manual deletion.",
         "Rule: expiresAt > Date.now()", COLOR_LIGHT_MINT, COLOR_DARK_GREEN),
        ("🌿", "Produce Listing Form", 
         "Seller portal with 1-click GPS detection, category selection (leafy, soft, root, herb), and quantity pricing.",
         "Page: /add-produce (AddProduce.jsx)", COLOR_CHIP_BG, COLOR_TEXT_MAIN),
        ("🎯", "Distance & Category Filters", 
         "Instant switching between 5km, 10km, 20km radius pills and vegetable categories without reloading the page.",
         "Component: Home.jsx marketplace", COLOR_CHIP_BG, COLOR_TEXT_MAIN),
        ("🛒", "Slide-Out Cart Drawer", 
         "Smooth slide-out cart supporting quantity adjustments, item removal, price calculation, and order submission.",
         "Component: CartDrawer.jsx", COLOR_CHIP_BG, COLOR_TEXT_MAIN),
        ("🔐", "User Authentication", 
         "Secure JWT login and signup with bcrypt password hashing and Joi validation to protect seller routes.",
         "Security: JWT + Bcrypt + Joi", COLOR_CHIP_BG, COLOR_TEXT_MAIN)
    ]

    f_coords = [
        (Inches(0.8), f_top1),
        (Inches(0.8) + feat_w + feat_gap_x, f_top1),
        (Inches(0.8) + 2 * (feat_w + feat_gap_x), f_top1),
        (Inches(0.8), f_top2),
        (Inches(0.8) + feat_w + feat_gap_x, f_top2),
        (Inches(0.8) + 2 * (feat_w + feat_gap_x), f_top2)
    ]

    for (icon, title, desc, meta, chip_bg, chip_col), (c_x, c_y) in zip(features, f_coords):
        create_card(slide7, c_x, c_y, feat_w, feat_h, COLOR_CARD_BG, COLOR_BORDER)
        tb = slide7.shapes.add_textbox(c_x + Inches(0.22), c_y + Inches(0.18), feat_w - Inches(0.44), feat_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {title}"
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(12.5)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN
        p1.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.line_spacing = 1.15
        p2.space_after = Pt(8)

        add_badge(slide7, c_x + Inches(0.2), c_y + Inches(1.92), feat_w - Inches(0.4), Inches(0.32),
                  meta, chip_bg, chip_col)

    # =========================================================================
    # SLIDE 8: Redesigned Modern & Attractive Limitations & Future Roadmap
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide8, COLOR_BG)
    add_header(slide8, "07 • Limitations & Future Roadmap", "Current Limitations & Planned Features", "A clear, modern overview of MVP boundaries alongside our feature development roadmap.")
    add_footer(slide8, 8)

    card_w2 = Inches(5.72)
    card_h2 = Inches(2.35)
    row1_y = Inches(1.65)
    row2_y = row1_y + card_h2 + Inches(0.22)

    roadmap_items = [
        ("💳", "Online Payments Integration",
         "CURRENT: No in-app payment gateway. Transactions are settled manually in cash or personal UPI upon pickup.",
         "ROADMAP: Integrated Razorpay / Stripe gateway with automatic escrow release once produce is collected.",
         "Planned: Razorpay / Stripe Webhook APIs",
         "PAYMENTS PENDING", COLOR_ROSE_BG, COLOR_ROSE_TEXT),
        
        ("📱", "Phone Number OTP Verification",
         "CURRENT: Basic authentication with email & password. Mobile number OTP verification is not implemented.",
         "ROADMAP: Seamless 1-tap mobile login with SMS OTP verification for faster, verified onboarding.",
         "Planned: Firebase Phone Auth / Twilio SMS",
         "AUTH UPGRADE", COLOR_AMBER_BG, COLOR_AMBER),

        ("🚚", "Doorstep Delivery Coordination",
         "CURRENT: Self-pickup only. Platform connects buyer and seller; physical collection is handled mutually.",
         "ROADMAP: Local neighborhood delivery rider network and volunteer drop-off pooling for convenient delivery.",
         "Planned: Distance Matrix API & Route Pooling",
         "DELIVERY PENDING", COLOR_AMBER_BG, COLOR_AMBER),

        ("⭐", "Seller Ratings & Community Trust",
         "CURRENT: No public reviews or rating system to evaluate seller produce quality or trustworthiness.",
         "ROADMAP: 5-star ratings, customer feedback reviews, and 'Verified Organic Home Grower' trust badges.",
         "Planned: Community Feedback & Verified Badges",
         "RATINGS PENDING", COLOR_LIGHT_MINT, COLOR_DARK_GREEN)
    ]

    grid_positions = [
        (Inches(0.8), row1_y),
        (Inches(6.81), row1_y),
        (Inches(0.8), row2_y),
        (Inches(6.81), row2_y)
    ]

    for (icon, title, cur_text, road_text, spec_text, badge_txt, b_bg, b_col), (pos_x, pos_y) in zip(roadmap_items, grid_positions):
        create_card(slide8, pos_x, pos_y, card_w2, card_h2, COLOR_CARD_BG, COLOR_BORDER)
        
        add_badge(slide8, pos_x + card_w2 - Inches(2.15), pos_y + Inches(0.16), Inches(1.95), Inches(0.28),
                  badge_txt, b_bg, b_col)

        tb = slide8.shapes.add_textbox(pos_x + Inches(0.25), pos_y + Inches(0.14), card_w2 - Inches(2.45), Inches(0.45))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {title}"
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN

        tb_body = slide8.shapes.add_textbox(pos_x + Inches(0.25), pos_y + Inches(0.6), card_w2 - Inches(0.5), card_h2 - Inches(0.7))
        tfb = tb_body.text_frame
        tfb.word_wrap = True
        tfb.margin_left = tfb.margin_top = tfb.margin_right = tfb.margin_bottom = 0

        p_cur = tfb.paragraphs[0]
        p_cur.text = "⚠️  " + cur_text
        p_cur.font.name = FONT_FAMILY
        p_cur.font.size = Pt(10)
        p_cur.font.color.rgb = COLOR_TEXT_MUTED
        p_cur.space_after = Pt(4)

        p_road = tfb.add_paragraph()
        p_road.text = "🚀  " + road_text
        p_road.font.name = FONT_FAMILY
        p_road.font.size = Pt(10)
        p_road.font.bold = True
        p_road.font.color.rgb = COLOR_DARK_GREEN
        p_road.space_after = Pt(4)

        p_spec = tfb.add_paragraph()
        p_spec.text = "🔧  " + spec_text
        p_spec.font.name = FONT_FAMILY
        p_spec.font.size = Pt(9.5)
        p_spec.font.color.rgb = COLOR_MID_GREEN

    # Bottom Highlight Pill Card spanning the bottom
    bot_bar = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.52), Inches(11.733), Inches(0.38))
    bot_bar.fill.solid()
    bot_bar.fill.fore_color.rgb = COLOR_LIGHT_MINT
    bot_bar.line.fill.background()
    bbtf = bot_bar.text_frame
    bbtf.word_wrap = False
    bbtf.margin_left = bbtf.margin_top = bbtf.margin_right = bbtf.margin_bottom = 0
    bbp = bbtf.paragraphs[0]
    bbp.text = "🎯 Summary: Current MVP focuses on core Discovery & Listing • Upcoming Phase adds Payments, OTP, Delivery & Ratings"
    bbp.alignment = PP_ALIGN.CENTER
    bbp.font.name = FONT_FAMILY
    bbp.font.size = Pt(10)
    bbp.font.bold = True
    bbp.font.color.rgb = COLOR_DARK_GREEN

    # =========================================================================
    # SLIDE 9: Conclusion and Future Vision
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    set_slide_background(slide9, COLOR_BG)
    add_header(slide9, "08 • Conclusion & Future Vision", "Grow More. Earn Fairly. Share Locally.", "A simple technological answer connecting local gardeners and nearby families.")
    add_footer(slide9, 9)

    sum_w = Inches(3.75)
    sum_h = Inches(2.25)
    sum_gap = Inches(0.24)
    sum_top = Inches(1.68)

    pillars_concl = [
        ("💵", "Extra Income for Growers", "Helps home gardeners and small farmers earn money from surplus harvest that would otherwise go unmonetized.", "Target: Fair Seller Returns"),
        ("🥗", "Affordable Fresh Produce", "Enables local buyers to purchase crisp, homegrown vegetables at prices 20–40% lower than supermarkets.", "Target: 20%–40% Savings"),
        ("🤝", "Connected Neighborhoods", "Builds a trusted, direct bridge between people growing fresh food and families living right nearby.", "Target: Community Food Loop")
    ]

    for i, (icon, p_title, p_desc, p_badge_text) in enumerate(pillars_concl):
        c_left = Inches(0.8) + i * (sum_w + sum_gap)
        create_card(slide9, c_left, sum_top, sum_w, sum_h, COLOR_CARD_BG, COLOR_BORDER_GREEN)
        tb = slide9.shapes.add_textbox(c_left + Inches(0.2), sum_top + Inches(0.18), sum_w - Inches(0.4), sum_h - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.text = f"{icon}  {p_title}"
        p1.font.name = FONT_FAMILY
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_DARK_GREEN
        p1.space_after = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_FAMILY
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED
        p2.line_spacing = 1.15
        p2.space_after = Pt(12)

        add_badge(slide9, c_left + Inches(0.2), sum_top + Inches(1.75), sum_w - Inches(0.4), Inches(0.32),
                  p_badge_text, COLOR_LIGHT_MINT, COLOR_DARK_GREEN)

    # Center Hero Banner
    banner_w = Inches(11.733)
    banner_h = Inches(1.95)
    banner_top = Inches(4.15)

    create_card(slide9, Inches(0.8), banner_top, banner_w, banner_h, COLOR_DARK_GREEN, None)
    tb_ban = slide9.shapes.add_textbox(Inches(1.2), banner_top + Inches(0.25), banner_w - Inches(0.8), banner_h - Inches(0.5))
    tfb = tb_ban.text_frame
    tfb.word_wrap = True
    tfb.margin_left = tfb.margin_top = tfb.margin_right = tfb.margin_bottom = 0

    p_tag = tfb.paragraphs[0]
    p_tag.alignment = PP_ALIGN.CENTER
    p_tag.text = '"Grow More. Earn Fairly. Share Locally."'
    p_tag.font.name = FONT_TITLE
    p_tag.font.size = Pt(24)
    p_tag.font.bold = True
    p_tag.font.color.rgb = COLOR_WHITE
    p_tag.space_after = Pt(8)

    p_state = tfb.add_paragraph()
    p_state.alignment = PP_ALIGN.CENTER
    p_state.text = "Veggity connects local producers who have surplus garden harvest with neighbors who want affordable fresh food."
    p_state.font.name = FONT_FAMILY
    p_state.font.size = Pt(12)
    p_state.font.color.rgb = RGBColor(220, 252, 231)
    p_state.space_after = Pt(10)

    p_demo = tfb.add_paragraph()
    p_demo.alignment = PP_ALIGN.CENTER
    p_demo.text = "🌐 Live Demo: veggity.vercel.app/home   |   Thank You — Questions & Answers"
    p_demo.font.name = FONT_FAMILY
    p_demo.font.size = Pt(11)
    p_demo.font.bold = True
    p_demo.font.color.rgb = RGBColor(187, 247, 208)

    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path} with {TOTAL_SLIDES} slides.")

if __name__ == "__main__":
    qr_img = os.path.abspath("veggity_qr.png")
    ensure_qr_code(qr_img)
    out = os.path.abspath("Veggity_Project_Presentation.pptx")
    create_deck(out, qr_img)
