import React from 'react';
import { Input } from '../ui/Input';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { preventInvalidPositiveIntegerKey, preventInvalidPositiveIntegerPaste } from '../../lib/positiveIntegerInput';

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
        min={1}
        step={1}
        onKeyDown={preventInvalidPositiveIntegerKey}
        onPaste={preventInvalidPositiveIntegerPaste}
        {...register('nombreLot', {
          min: { value: 1, message: 'Le nombre de lots doit être supérieur ou égal à 1' },
          validate: value => value === '' || value == null || Number.isInteger(Number(value))
            || 'Le nombre de lots doit être un entier',
        })}
        error={nombreLotError}
      />
    </>
  );
}
