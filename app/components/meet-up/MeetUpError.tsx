type Props = { message: string };

export default function MeetUpError({ message }: Props) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 mb-6 text-center">
      <span className="font-semibold">Error:</span> {message}
    </div>
  );
}
