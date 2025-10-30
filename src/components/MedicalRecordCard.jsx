import React from 'react';
import {
  FaHeartbeat,
  FaNotesMedical,
  FaFilePdf,
  FaImage,
} from 'react-icons/fa';
import {
  MdMedicalServices,
  MdOutlineDateRange,
  MdPerson,
} from 'react-icons/md';
import { GiMedicines, GiTestTubes } from 'react-icons/gi';

const MedicalRecordCard = ({ record }) => {
  const {
    diagnosis,
    medicines,
    symptoms,
    fileName,
    fileType,
    fileUrl,
    visitDate,
    doctor,
    followUpNotes,
    prescribedTests,
  } = record;

  const hoverBoxStyle =
    'bg-surface rounded-xl p-3 shadow border-2 border-accent break-words w-full sm:w-auto transition-colors duration-200 hover:bg-accent-30';

  return (
    <div className="bg-surface w-full p-3 sm:p-4 shadow text-text border border-gray-600/20 flex flex-col gap-4 sm:gap-6 rounded-xl text-sm sm:text-base">
      
      {/* Visit Date */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-medium">
        <MdOutlineDateRange className="text-accent shrink-0" />
        <span className="break-words">{new Date(visitDate).toDateString()}</span>
      </div>

      {/* Creation Time */}
      {record.createdAt && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>📝</span>
          <span className="break-words">
            Record created at {new Date(record.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      {/* Doctor Info */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-medium">
        <MdPerson className="text-accent shrink-0" />
        <span className="break-words">{record.doctorName || doctor?.name || 'Unknown Doctor'} {doctor?.id ? `(ID: ${doctor.id})` : ''}</span>
      </div>

      {/* Symptoms */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 font-medium">
        <div className="flex items-center gap-2">
          <FaHeartbeat className="text-accent" />
          <h4 className="min-w-[90px] sm:min-w-[100px]">Symptoms</h4>
        </div>
        <div className={hoverBoxStyle}>
          {symptoms?.join(', ') || 'N/A'}
        </div>
      </div>

      {/* Diagnosis */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 font-medium">
        <div className="flex items-center gap-2">
          <MdMedicalServices className="text-accent" />
          <h4 className="min-w-[90px] sm:min-w-[100px]">Diagnosis</h4>
        </div>
        <div className={hoverBoxStyle}>
          {diagnosis || 'N/A'}
        </div>
      </div>

      {/* Medicines */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 font-medium">
        <div className="flex items-center gap-2">
          <GiMedicines className="text-accent" />
          <h4 className="min-w-[90px] sm:min-w-[100px]">Medicines</h4>
        </div>
        <div className={hoverBoxStyle}>
          {medicines?.join(', ') || 'N/A'}
        </div>
      </div>

      {/* Prescribed Tests */}
      {prescribedTests?.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 font-medium">
          <div className="flex items-center gap-2">
            <GiTestTubes className="text-accent" />
            <h4 className="min-w-[90px] sm:min-w-[100px]">Tests</h4>
          </div>
          <div className={hoverBoxStyle}>
            {prescribedTests.join(', ')}
          </div>
        </div>
      )}

      {/* Follow-up Notes */}
      {followUpNotes && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 font-medium">
          <div className="flex items-center gap-2">
            <FaNotesMedical className="text-accent" />
            <h4 className="min-w-[90px] sm:min-w-[100px]">Follow-up</h4>
          </div>
          <div className={hoverBoxStyle}>
            {followUpNotes}
          </div>
        </div>
      )}

      {/* File Section */}
      {fileUrl && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 font-medium">
          <div className="flex items-center gap-2">
            {fileType === 'pdf' ? (
              <FaFilePdf className="text-accent" />
            ) : (
              <FaImage className="text-accent" />
            )}
            <h4 className="min-w-[90px] sm:min-w-[100px]">File</h4>
          </div>
          <div className={`${hoverBoxStyle} break-all`}>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-accent"
            >
              {fileName || 'View File'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecordCard;
