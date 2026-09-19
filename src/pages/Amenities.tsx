import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataApi } from '@/lib/dataApi';
import { Card, Badge, Button, Modal, Input, Select, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import type { Amenity, Booking, Unit } from '@/types';
import { CalendarDays, Users, AlertCircle } from 'lucide-react';

export function Amenities() {
  const { role, currentUnit, units } = useApp();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, Unit>>({});
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [bookAmenity, setBookAmenity] = useState<Amenity | null>(null);

  const [bookDate, setBookDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [bookUnitId, setBookUnitId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, amData, bkData] = await Promise.all([
          dataApi.listUnits(),
          dataApi.listAmenities(),
          dataApi.listBookings(),
        ]);
        const map: Record<string, Unit> = {};
        unitsData.forEach((u) => { map[u.id] = u; });
        setUnitsMap(map);
        setAmenities(amData);
        setBookings(
          [...bkData].sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()),
        );
      } catch {
        setError('Could not load amenities. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function makeBooking() {
    if (!bookAmenity) return;
    setError('');
    const unitId = role === 'resident' ? currentUnit?.id : bookUnitId;
    if (!unitId) {
      setError('Please select a unit');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    // Check for conflicts
    const conflict = bookings.find(
      (b) =>
        b.amenity_id === bookAmenity.id &&
        b.booking_date === bookDate &&
        b.status === 'confirmed' &&
        !(b.end_time <= startTime || b.start_time >= endTime),
    );
    if (conflict) {
      setError('This time slot is already booked. Please choose another time.');
      return;
    }

    setSaving(true);
    try {
      const data = await dataApi.createBooking({
        amenity_id: bookAmenity.id,
        unit_id: unitId,
        booking_date: bookDate,
        start_time: startTime,
        end_time: endTime,
        status: 'confirmed',
      });
      setBookings([data, ...bookings]);
      setShowBook(false);
      setBookAmenity(null);
      setBookDate(new Date().toISOString().slice(0, 10));
      setStartTime('10:00');
      setEndTime('12:00');
      setBookUnitId('');
    } catch {
      setError('Could not confirm the booking. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function cancelBooking(id: string) {
    setError('');
    try {
      await dataApi.updateBooking(id, { status: 'cancelled' });
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)));
    } catch {
      setError('Could not cancel the booking. Please try again.');
    }
  }

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Amenity Booking</h1>
        <p className="text-slate-500 mt-1">Book clubhouse, gym, pool & more</p>
      </div>

      {error && !showBook && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {amenities.map((a) => (
          <Card key={a.id}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{a.name}</h3>
              {a.hourly_rate > 0 && <Badge color="teal">₹{a.hourly_rate}/hr</Badge>}
            </div>
            <p className="text-sm text-slate-500 mb-3">{a.description}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Capacity: {a.capacity}</span>
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setBookAmenity(a);
                setShowBook(true);
                setError('');
              }}
            >
              <CalendarDays className="h-4 w-4" /> Book Slot
            </Button>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">All Bookings</h3>
        </div>
        {bookings.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No bookings yet" message="Book an amenity to get started." />
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Amenity</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const amenity = amenities.find((a) => a.id === b.amenity_id);
                  const unit = unitsMap[b.unit_id];
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{amenity?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{unit?.unit_number ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(b.booking_date)}</td>
                      <td className="px-4 py-3 text-slate-500">{b.start_time} - {b.end_time}</td>
                      <td className="px-4 py-3">
                        {b.status === 'confirmed' && <Badge color="green">Confirmed</Badge>}
                        {b.status === 'cancelled' && <Badge color="red">Cancelled</Badge>}
                        {b.status === 'completed' && <Badge color="slate">Completed</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        {b.status === 'confirmed' && (
                          <button onClick={() => cancelBooking(b.id)} className="text-xs text-rose-500 hover:underline">
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showBook} onClose={() => { setShowBook(false); setError(''); }} title={`Book ${bookAmenity?.name ?? ''}`}>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Input label="Date" type="date" value={bookDate} onChange={setBookDate} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Time" type="time" value={startTime} onChange={setStartTime} />
            <Input label="End Time" type="time" value={endTime} onChange={setEndTime} />
          </div>
          {role === 'admin' && (
            <Select
              label="Unit"
              value={bookUnitId}
              onChange={setBookUnitId}
              options={[{ value: '', label: 'Select unit...' }, ...units.map((u) => ({ value: u.id, label: `${u.unit_number} - ${u.owner_name}` }))]}
            />
          )}
          {bookAmenity && bookAmenity.hourly_rate > 0 && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Estimated charge: ₹{bookAmenity.hourly_rate}/hour
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowBook(false); setError(''); }}>Cancel</Button>
            <Button onClick={makeBooking} disabled={saving}>
              {saving ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
