import { CarFront, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { addCar, removeCar } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { PlateTag } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/Display'
import { Field, Input, Select, Stepper } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'
import { useAction } from '@/components/ui/Toast'
import { FUEL_LABEL, isEstimableFuel } from '@/lib/fuel'
import type { FuelType } from '@/lib/types'
import { useMe } from '@/store/selectors'

const empty = { make: '', model: '', color: '', plate: '', fuelType: 'gasoline' as FuelType, seats: 4 }

export default function Cars() {
  const me = useMe()!
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(empty)
  const add = useAction(addCar, { success: 'Car added', onSuccess: () => { setOpen(false); setF(empty) } })
  const remove = useAction(removeCar, { success: 'Car removed' })
  const ok = f.make.trim() && f.model.trim() && f.plate.trim().length >= 4

  return (
    <div>
      <PageHeader back="/app/profile" title="My cars" subtitle="Add as many cars as you like — pick one for each ride. No verification needed."
        actions={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>Add car</Button>} />

      {me.cars.length === 0 ? (
        <EmptyState icon={<CarFront className="size-6" />} title="No cars yet" body="Add the car you'll host rides with." action={<Button onClick={() => setOpen(true)}>Add your first car</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {me.cars.map((c) => (
            <div key={c.id} className="card flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-xl font-bold text-forest">{c.make} {c.model}</p>
                  <p className="text-[13px] text-ink-soft">{c.color} · {c.seats} passenger seats</p>
                </div>
                <PlateTag plate={c.plate} />
              </div>
              <div className="flex items-center justify-between">
                <Badge tone={isEstimableFuel(c.fuelType) ? 'sprout' : 'sky'}>{FUEL_LABEL[c.fuelType].toUpperCase()}{!isEstimableFuel(c.fuelType) && ' · NATIVE LATER'}</Badge>
                <button onClick={() => remove.run(c.id)} disabled={remove.pending} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-danger">
                  <Trash2 className="size-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add a car"
        footer={<Button block size="lg" disabled={!ok} loading={add.pending} onClick={() => add.run({ ...f, make: f.make.trim(), model: f.model.trim(), color: f.color.trim(), plate: f.plate.trim() })}>Add car</Button>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make">{(id) => <Input id={id} placeholder="Hyundai" value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} />}</Field>
            <Field label="Model">{(id) => <Input id={id} placeholder="Elantra" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />}</Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Color">{(id) => <Input id={id} placeholder="Silver" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />}</Field>
            <Field label="Plate number">{(id) => <Input id={id} dir="auto" placeholder="ق ه ط 4821" value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} />}</Field>
          </div>
          <Field label="Fuel type" hint={!isEstimableFuel(f.fuelType) ? 'Hybrid & electric fuel estimates arrive with the native app.' : undefined}>
            {(id) => (
              <Select id={id} value={f.fuelType} onChange={(e) => setF({ ...f, fuelType: e.target.value as FuelType })}>
                {(Object.keys(FUEL_LABEL) as FuelType[]).map((k) => <option key={k} value={k}>{FUEL_LABEL[k]}{!isEstimableFuel(k) ? ' (native later)' : ''}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Passenger seats">{() => <Stepper value={f.seats} onChange={(v) => setF({ ...f, seats: v })} min={1} max={6} label="seats" />}</Field>
        </div>
      </Modal>
    </div>
  )
}
