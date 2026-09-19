"""Generate maintenance bill / payment receipt PDFs."""

from __future__ import annotations

from io import BytesIO
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.operations.models import Bill, Payment


MONTHS = (
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
)


def _money(value) -> str:
    try:
        return f'Rs. {float(value):,.2f}'
    except (TypeError, ValueError):
        return f'Rs. {value}'


def _styles():
    base = getSampleStyleSheet()
    return {
        'title': ParagraphStyle(
            'TitleNV',
            parent=base['Heading1'],
            fontSize=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#0a1f14'),
            spaceAfter=4,
        ),
        'sub': ParagraphStyle(
            'SubNV',
            parent=base['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#334155'),
            spaceAfter=12,
        ),
        'heading': ParagraphStyle(
            'HeadNV',
            parent=base['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#0a1f14'),
            spaceBefore=8,
            spaceAfter=6,
        ),
        'body': ParagraphStyle(
            'BodyNV',
            parent=base['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1e293b'),
            leading=14,
        ),
        'right': ParagraphStyle(
            'RightNV',
            parent=base['Normal'],
            fontSize=9,
            alignment=TA_RIGHT,
            textColor=colors.HexColor('#64748b'),
        ),
        'footer': ParagraphStyle(
            'FootNV',
            parent=base['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#64748b'),
            spaceBefore=16,
        ),
    }


def build_bill_pdf(bill: Bill, payment: Optional[Payment] = None) -> bytes:
    """PDF for a maintenance bill; if payment given, include receipt section."""
    society = bill.society
    unit = bill.unit
    styles = _styles()
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f'Bill-{unit.unit_number}-{bill.period_month}-{bill.period_year}',
    )
    story = []
    period = f'{MONTHS[bill.period_month]} {bill.period_year}'
    doc_title = 'PAYMENT RECEIPT & BILL' if payment else 'MAINTENANCE BILL'

    story.append(Paragraph(society.name, styles['title']))
    if society.address:
        story.append(Paragraph(society.address, styles['sub']))
    story.append(Paragraph(doc_title, styles['heading']))
    story.append(Paragraph(
        f'Document generated for Navya Naman Vatika · Developed by Kiji Technology',
        styles['right'],
    ))
    story.append(Spacer(1, 8))

    info_rows = [
        ['Unit', unit.unit_number, 'Owner', unit.owner_name],
        ['Floor', str(unit.floor), 'Phone', unit.phone or '—'],
        ['Period', period, 'Due date', str(bill.due_date)],
        ['Bill status', bill.status.upper(), 'Bill ID', str(bill.pk)],
    ]
    info = Table(info_rows, colWidths=[28 * mm, 52 * mm, 28 * mm, 52 * mm])
    info.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1e293b')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3f7f4')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info)
    story.append(Spacer(1, 12))

    story.append(Paragraph('Amount details', styles['heading']))
    amount_rows = [
        ['Description', 'Amount'],
        ['Base maintenance', _money(bill.base_amount)],
        ['Late fee', _money(bill.late_fee)],
        ['Total payable', _money(bill.total_amount)],
    ]
    amounts = Table(amount_rows, colWidths=[110 * mm, 50 * mm])
    amounts.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0a1f14')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d1fae5')),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(amounts)

    if payment:
        story.append(Spacer(1, 14))
        story.append(Paragraph('Payment confirmation', styles['heading']))
        pay_rows = [
            ['Receipt No.', str(payment.pk).upper()[:12], 'Paid at', str(payment.paid_at)[:19]],
            ['Amount paid', _money(payment.amount), 'Method', payment.method.upper()],
            ['Reference', payment.reference_no or '—', 'Status', 'CONFIRMED'],
        ]
        pay = Table(pay_rows, colWidths=[28 * mm, 52 * mm, 28 * mm, 52 * mm])
        pay.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf5')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#34d399')),
            ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#a7f3d0')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(pay)

    story.append(Spacer(1, 14))
    story.append(Paragraph('Payment / bank details', styles['heading']))
    bank_rows = [
        ['UPI ID', society.upi_id or '—'],
        ['Payee name', society.payee_name or '—'],
        ['Bank', society.bank_name or '—'],
        ['Account No.', society.account_number or '—'],
        ['IFSC', society.ifsc or '—'],
    ]
    bank = Table(bank_rows, colWidths=[40 * mm, 120 * mm])
    bank.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOX', (0, 0), (-1, -1), 0.4, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.2, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(bank)

    story.append(Paragraph(
        'Thank you for your payment. This is a system-generated document.',
        styles['footer'],
    ))
    doc.build(story)
    return buf.getvalue()


def build_payment_receipt_pdf(payment: Payment) -> bytes:
    """Receipt PDF; includes bill section when linked."""
    if payment.bill_id:
        return build_bill_pdf(payment.bill, payment=payment)

    # Standalone payment without bill
    society = payment.society
    unit = payment.unit
    styles = _styles()
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm)
    story = [
        Paragraph(society.name, styles['title']),
        Paragraph('PAYMENT RECEIPT', styles['heading']),
        Spacer(1, 10),
    ]
    rows = [
        ['Receipt No.', str(payment.pk), 'Unit', unit.unit_number],
        ['Owner', unit.owner_name, 'Amount', _money(payment.amount)],
        ['Method', payment.method.upper(), 'Reference', payment.reference_no or '—'],
        ['Paid at', str(payment.paid_at)[:19], 'Status', 'CONFIRMED'],
    ]
    t = Table(rows, colWidths=[28 * mm, 52 * mm, 28 * mm, 52 * mm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecfdf5')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#34d399')),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#a7f3d0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    story.append(t)
    story.append(Paragraph('Thank you for your payment.', styles['footer']))
    doc.build(story)
    return buf.getvalue()
