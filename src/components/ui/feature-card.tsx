"use client";

import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Link } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

export function FeatureCard({ title, description, icon, image }: FeatureCardProps) {
  return (
    <CardContainer className="inter-var" containerClassName="py-4 md:py-10">
      <CardBody className="bg-white relative group/card dark:hover:shadow-2xl dark:hover:shadow-logistics-500/[0.1] dark:bg-gray-800 dark:border-white/[0.2] border-black/[0.1] w-full max-w-[350px] sm:max-w-[400px] h-auto rounded-xl p-4 sm:p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-semibold text-gray-900 dark:text-white"
        >
          {title}
        </CardItem>
        <CardItem
          as="div"
          translateZ="60"
          className="text-gray-600 text-sm max-w-sm mt-2 dark:text-gray-300"
        >
          {description}
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <img
            src={image}
            height="1000"
            width="1000"
            className="h-48 sm:h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
            alt={title}
          />
        </CardItem>
        <div className="flex justify-between items-center mt-6 sm:mt-8">
          <CardItem
            translateZ={20}
            className="text-logistics-600 dark:text-logistics-400"
          >
            {icon}
          </CardItem>
          <CardItem
            translateZ={20}
            as={Link}
            to="/features"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-logistics-600 text-white text-xs font-bold hover:bg-logistics-700 transition-colors"
          >
            Learn More
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}
