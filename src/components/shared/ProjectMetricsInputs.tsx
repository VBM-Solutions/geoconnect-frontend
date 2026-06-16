import React from 'react';
import { Input } from '../ui/Input';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

interface ProjectMetricsInputsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function ProjectMetricsInputs({ register, errors }: Readonly<ProjectMetricsInputsProps>) {
  const superficieError = errors.superficie
    ? (errors.superficie as { message?: string }).message
    : undefined;
  const nombreLotError = errors.nombreLot
    ? (errors.nombreLot as { message?: string }).message
    : undefined;

  return (
    <>
      <Input
        label="Superficie (m²)"
        type="number"
        placeholder="Ex : 500"
        min={0}
        {...register('superficie', {
          min: { value: 0, message: 'La superficie doit être positive' },
        })}
        error={superficieError}
      />
      <Input
        label="Nombre de lots"
        type="number"
        placeholder="Ex : 1"
        min={0}
        {...register('nombreLot', {
          min: { value: 0, message: 'Le nombre de lots doit être positif' },
        })}
        error={nombreLotError}
      />
    </>
  );
}
