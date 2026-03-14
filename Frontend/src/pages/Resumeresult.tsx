import React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ScrollAnimate } from "@/components/ScrollAnimate";
import { useUser } from "@clerk/clerk-react";
import { getResumeHistoryRecordById } from "@/utils/resumeHistory";

import {
  CheckCircle,
  TrendingUp,
  HelpCircle,
  FileText,
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  AlertCircle,
  Target,
  Lightbulb,
} from "lucide-react";

const ResumeResults = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const historyId = searchParams.get("historyId");
  const savedRecord = historyId && user?.id ? getResumeHistoryRecordById(user.id, historyId) : null;
  const results = location.state?.results || savedRecord?.results;
  const mode = location.state?.mode || savedRecord?.mode;

  if (!results) {
    return (
      <div className="container mx-auto py-16 text-center">
        <HelpCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">No Analysis Data Found</h2>
        <p className="text-muted-foreground">
          Please return to the analyzer page to upload a resume.
        </p>
      </div>
    );
  }

  // ------------------------------
  //          RAPIDAPI MODE
  // ------------------------------
  if (mode === "parse") {
    const data = results?.parsed_data || {};

    return (
      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🤖 AI Resume Parsing Results
        </h1>

        {/* Personal Info */}
        <div className="max-w-3xl mx-auto p-6 border rounded-xl shadow bg-white mb-8">
          <h2 className="text-2xl flex items-center gap-2 font-semibold mb-4">
            <User className="w-6 h-6 text-blue-500" /> Personal Information
          </h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
            {JSON.stringify(data.personal_info, null, 2)}
          </pre>
        </div>

        {/* Skills */}
        <div className="max-w-3xl mx-auto p-6 border rounded-xl shadow bg-white mb-8">
          <h2 className="text-2xl flex items-center gap-2 font-semibold mb-4">
            <Sparkles className="w-6 h-6 text-purple-500" /> Skills
          </h2>
          {data.skills && data.skills.length ? (
            <ul className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => (
                <li
                  key={i}
                  className="px-3 py-1 bg-purple-100 text-purple-900 rounded-full text-sm"
                >
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No skills detected.</p>
          )}
        </div>

        {/* Education */}
        <div className="max-w-3xl mx-auto p-6 border rounded-xl shadow bg-white mb-8">
          <h2 className="text-2xl flex items-center gap-2 font-semibold mb-4">
            <GraduationCap className="w-6 h-6 text-green-500" /> Education
          </h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
            {JSON.stringify(data.education, null, 2)}
          </pre>
        </div>

        {/* Experience */}
        <div className="max-w-3xl mx-auto p-6 border rounded-xl shadow bg-white mb-8">
          <h2 className="text-2xl flex items-center gap-2 font-semibold mb-4">
            <Briefcase className="w-6 h-6 text-orange-500" /> Experience
          </h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
            {JSON.stringify(data.experience, null, 2)}
          </pre>
        </div>

        {/* Projects */}
        <div className="max-w-3xl mx-auto p-6 border rounded-xl shadow bg-white mb-8">
          <h2 className="text-2xl flex items-center gap-2 font-semibold mb-4">
            <FileText className="w-6 h-6 text-indigo-500" /> Projects
          </h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
            {JSON.stringify(data.projects, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // ------------------------------
  //          ATS MODE
  // ------------------------------
  const {
    profession,
    matched_skills,
    missing_skills,
    profession_ats_score,
    suggestions,
  } = results;

  return (
    <div className="container mx-auto py-16 px-4 min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <ScrollAnimate animation="zoom-out">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            🎯 Resume Analysis Results
          </h1>
          <p className="text-lg text-muted-foreground">
            Job Role: <span className="font-semibold text-foreground">{profession}</span>
          </p>
        </div>
      </ScrollAnimate>

      {/* ATS Score */}
      <ScrollAnimate animation="zoom-out" delay={100}>
        <div className="max-w-2xl mx-auto p-8 rounded-3xl shadow-2xl border-2 bg-gradient-to-br from-white via-primary/5 to-muted/30 mb-12 backdrop-blur-sm relative overflow-hidden group hover:shadow-glow transition-all duration-500">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-hero opacity-5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <p className="text-sm text-primary font-medium mb-2">
              ATS Compatibility Score
            </p>
            <h3
              className="text-6xl font-extrabold mt-1 gradient-text-animate"
              style={{
                color:
                  profession_ats_score > 70
                    ? "hsl(142, 76%, 36%)"
                    : profession_ats_score > 50
                    ? "hsl(38, 92%, 50%)"
                    : "hsl(0, 84%, 60%)",
              }}
            >
              {profession_ats_score}%
            </h3>
            <p className="mt-4 text-muted-foreground">
              This score reflects how well your resume matches the required skills
              for <b className="text-foreground">{profession}</b>.
            </p>
          </div>
        </div>
      </ScrollAnimate>

      {/* Skills section */}
      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-12">
        {/* Matched Skills */}
        <ScrollAnimate animation="slide-up" delay={200}>
          <div className="p-6 border-2 rounded-2xl shadow-lg bg-gradient-to-br from-green-50 via-green-50/80 to-emerald-50/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <h2 className="text-2xl flex items-center gap-2 font-semibold text-green-700 mb-4 group-hover:text-green-800 transition-colors">
                <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" /> Matched Skills
              </h2>

          {matched_skills?.length === 0 ? (
            <p className="text-green-800">No matched skills found.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {matched_skills?.map((skill, index) => (
                <li
                  key={index}
                  className="px-3 py-1 text-sm bg-green-200 text-green-900 rounded-full"
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
            </div>
          </div>
        </ScrollAnimate>

        {/* Missing Skills */}
        <ScrollAnimate animation="slide-up" delay={300}>
          <div className="p-6 border-2 rounded-2xl shadow-lg bg-gradient-to-br from-red-50 via-rose-50/80 to-pink-50/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <h2 className="text-2xl flex items-center gap-2 font-semibold text-red-700 mb-4 group-hover:text-red-800 transition-colors">
                <TrendingUp className="w-6 h-6 group-hover:scale-110 transition-transform" /> Missing Skills
              </h2>

          {missing_skills?.length === 0 ? (
            <p className="text-green-700">Great! No missing skills.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {missing_skills?.map((skill, index) => (
                <li
                  key={index}
                  className="px-3 py-1 text-sm bg-red-200 text-red-900 rounded-full"
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
            </div>
          </div>
        </ScrollAnimate>
      </div>

      {/* Overall Assessment Card */}
      <ScrollAnimate animation="zoom-out" delay={400}>
        <div className="max-w-4xl mx-auto mt-12 mb-8">
          <div className={`p-8 rounded-2xl shadow-xl border-2 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
          profession_ats_score >= 70 
            ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100/50 border-green-300' 
            : profession_ats_score >= 50 
            ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100/50 border-yellow-300' 
            : 'bg-gradient-to-br from-red-50 via-rose-50 to-red-100/50 border-red-300'
        }`}>
          {/* Animated background gradient */}
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${
            profession_ats_score >= 70 
              ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
              : profession_ats_score >= 50 
              ? 'bg-gradient-to-r from-yellow-400 to-amber-400' 
              : 'bg-gradient-to-r from-red-400 to-rose-400'
          }`}></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {profession_ats_score >= 70 
                    ? '✅ Your Resume is Good!' 
                    : profession_ats_score >= 50 
                    ? '⚠️ Your Resume Needs Improvement' 
                    : '❌ Your Resume Needs Significant Work'}
                </h2>
                <p className="text-lg text-gray-700">
                  {profession_ats_score >= 70 
                    ? `With a score of ${profession_ats_score}%, your resume is well-aligned with the ${profession} role. Focus on the improvements below to make it even better.`
                    : profession_ats_score >= 50 
                    ? `With a score of ${profession_ats_score}%, your resume has potential but needs work to be competitive for ${profession} positions.`
                    : `With a score of ${profession_ats_score}%, your resume needs significant improvements to match ${profession} requirements.`}
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </ScrollAnimate>

      {/* What You're Missing Section */}
      {missing_skills && missing_skills.length > 0 && (
        <ScrollAnimate animation="slide-up" delay={500}>
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> Where You're Lacking
            </h2>
            <p className="text-red-700 mb-4">
              Your resume is missing these important skills for <strong>{profession}</strong>:
            </p>
            <div className="flex flex-wrap gap-2">
              {missing_skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-red-200 text-red-900 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
            <p className="text-red-700 mt-4 text-sm">
              💡 <strong>Action:</strong> Add these skills to your resume, either in a dedicated skills section or within your experience descriptions.
            </p>
          </div>
          </div>
        </ScrollAnimate>
      )}

      {/* AI Suggestions */}
      <ScrollAnimate animation="zoom-out" delay={600}>
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white shadow-xl rounded-3xl border-2 border-gray-200 p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white p-6 rounded-2xl shadow-lg mb-8 relative overflow-hidden group/header hover:shadow-xl transition-all duration-300">
              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover/header:opacity-30 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-7 h-7" /> Detailed Feedback & Improvement Plan
                </h2>
                <p className="opacity-90 text-sm mt-1">
                  AI-generated comprehensive analysis and actionable recommendations.
                </p>
              </div>
            </div>

            {/* Markdown rendering with better styling */}
            <div className="relative z-10 prose prose-indigo max-w-none leading-relaxed text-gray-800 prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-ul:list-disc prose-ul:ml-6 prose-li:my-2 prose-strong:text-gray-900 prose-strong:font-semibold">
              <ReactMarkdown>{suggestions}</ReactMarkdown>
            </div>
          </div>
        </div>
      </ScrollAnimate>
    </div>
  );
};

export default ResumeResults;
