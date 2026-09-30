import Image from "next/image";

type Props = {
  service: "ec2" | "rds" | "eks" | "elb" | "s3";
  className?: string;
};

export default function AwsIcon({ service, className = "h-5 w-5" }: Props) {
  return (
    <Image
      src={`/aws-icons/${service}.svg`}
      alt={`AWS ${service.toUpperCase()}`}
      width={20}
      height={20}
      className={className}
      unoptimized
    />
  );
}
