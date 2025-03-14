"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ArxivPaper } from '@/types/ArxivPaper';

interface LikedPapersContextType {
    likedPapers: ArxivPaper[];
    toggleLike: (paper: ArxivPaper) => void;
    isLiked: (id: string) => boolean;
}

const LikedPapersContext = createContext<LikedPapersContextType | undefined>(undefined);

export function LikedPapersProvider({ children }: { children: ReactNode }) {
    const [likedPapers, setLikedPapers] = useState<ArxivPaper[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("likedPapers");
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("likedPapers", JSON.stringify(likedPapers));
        }
    }, [likedPapers]);

    const toggleLike = (paper: ArxivPaper) => {
        setLikedPapers((prev) => {
            const alreadyLiked = prev.some((p) => p.id === paper.id);
            if (alreadyLiked) {
                return prev.filter((p) => p.id !== paper.id);
            } else {
                return [...prev, paper];
            }
        });
    };

    const isLiked = (id: string) => {
        return likedPapers.some((paper) => paper.id === id);
    };

    return (
        <LikedPapersContext.Provider value={{ likedPapers, toggleLike, isLiked }}>
            {children}
        </LikedPapersContext.Provider>
    );
}

export function useLikedPapers() {
    const context = useContext(LikedPapersContext);
    if (!context) {
        throw new Error("useLikedPapers must be used within a LikedPapersProvider");
    }
    return context;
}
