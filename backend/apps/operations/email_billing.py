"""Email helpers for payment confirmation + PDF bills."""

from __future__ import annotations

import logging
from typing import Optional

from django.conf import settings
from django.core.mail import EmailMessage

from apps.operations.models import Bill, Payment
from apps.operations.pdf_docs import build_bill_pdf, build_payment_receipt_pdf

logger = logging.getLogger(__name__)


def _from_email() -> str:
    return getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'noreply@navyanamanvatika.com'


def resolve_unit_email(unit, override_email: Optional[str] = None) -> Optional[str]:
    if override_email and '@' in override_email:
        return override_email.strip()
    if unit.resident_user_id and getattr(unit.resident_user, 'email', None):
        return unit.resident_user.email
    return None


def resolve_payment_recipient(payment: Payment, override_email: Optional[str] = None) -> Optional[str]:
    return resolve_unit_email(payment.unit, override_email)


def send_bill_pdf_email(bill: Bill, *, override_email: Optional[str] = None) -> dict:
    """Email maintenance bill PDF to the flat owner."""
    to_email = resolve_unit_email(bill.unit, override_email)
    if not to_email:
        return {'sent': False, 'email': None, 'reason': 'No owner email on file for this unit'}

    society = bill.society
    unit = bill.unit
    period = f'{bill.period_month:02d}/{bill.period_year}'
    subject = f'Maintenance Bill {period} — {society.name} ({unit.unit_number})'
    body = (
        f'Dear {unit.owner_name},\n\n'
        f'Your maintenance bill for {period} is ready.\n\n'
        f'Society: {society.name}\n'
        f'Unit: {unit.unit_number}\n'
        f'Base amount: Rs. {bill.base_amount}\n'
        f'Late fee: Rs. {bill.late_fee}\n'
        f'Total payable: Rs. {bill.total_amount}\n'
        f'Due date: {bill.due_date}\n'
        f'Status: {bill.status.upper()}\n\n'
        f'UPI: {society.upi_id}\n'
        f'Payee: {society.payee_name}\n\n'
        'Please find the bill attached as a PDF.\n\n'
        'Thank you,\n'
        f'{society.name}\n'
        'Developed by Kiji Technology\n'
    )
    try:
        pdf_bytes = build_bill_pdf(bill)
        filename = f'bill-{unit.unit_number}-{bill.period_month}-{bill.period_year}.pdf'
        mail = EmailMessage(subject=subject, body=body, from_email=_from_email(), to=[to_email])
        mail.attach(filename, pdf_bytes, 'application/pdf')
        mail.send(fail_silently=False)
        logger.info('Bill PDF emailed to %s for bill %s', to_email, bill.pk)
        return {'sent': True, 'email': to_email, 'reason': None}
    except Exception as exc:  # noqa: BLE001
        logger.exception('Failed to email bill PDF for %s', bill.pk)
        return {'sent': False, 'email': to_email, 'reason': str(exc)}


def send_payment_confirmation_email(
    payment: Payment,
    *,
    override_email: Optional[str] = None,
) -> dict:
    """
    Send payment confirmation email with PDF bill/receipt attached.
    Returns {sent: bool, email: str|None, reason: str|None}.
    """
    to_email = resolve_payment_recipient(payment, override_email)
    if not to_email:
        return {
            'sent': False,
            'email': None,
            'reason': 'No owner email on file for this unit',
        }

    society = payment.society
    unit = payment.unit
    bill = payment.bill
    period = ''
    if bill:
        period = f' for {bill.period_month:02d}/{bill.period_year}'

    subject = f'Payment confirmed{period} — {society.name} ({unit.unit_number})'
    body = (
        f'Dear {unit.owner_name},\n\n'
        f'Your payment has been received and confirmed.\n\n'
        f'Society: {society.name}\n'
        f'Unit: {unit.unit_number}\n'
        f'Amount: Rs. {payment.amount}\n'
        f'Method: {payment.method.upper()}\n'
        f'Reference: {payment.reference_no or "—"}\n'
        f'Receipt No: {payment.pk}\n'
    )
    if bill:
        body += (
            f'Bill period: {bill.period_month:02d}/{bill.period_year}\n'
            f'Bill total: Rs. {bill.total_amount}\n'
            f'Bill status: {bill.status.upper()}\n'
        )
    body += (
        '\nPlease find your bill / payment receipt attached as a PDF.\n\n'
        'Thank you,\n'
        f'{society.name}\n'
        'Developed by Kiji Technology\n'
    )

    try:
        pdf_bytes = build_payment_receipt_pdf(payment)
        filename = f'bill-receipt-{unit.unit_number}-{payment.pk}.pdf'
        mail = EmailMessage(
            subject=subject,
            body=body,
            from_email=_from_email(),
            to=[to_email],
        )
        mail.attach(filename, pdf_bytes, 'application/pdf')
        mail.send(fail_silently=False)
        logger.info('Payment confirmation emailed to %s for payment %s', to_email, payment.pk)
        return {'sent': True, 'email': to_email, 'reason': None}
    except Exception as exc:  # noqa: BLE001 — surface soft failure to API
        logger.exception('Failed to email payment confirmation for %s', payment.pk)
        return {'sent': False, 'email': to_email, 'reason': str(exc)}
