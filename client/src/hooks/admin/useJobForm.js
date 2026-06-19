import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/ui/Toast";

const EMPTY_JOB = {
  title: "",
  company: "",
  location: "",
  country: "",
  region: "",
  type: "Full-time",
  remote: false,
  salaryMin: "",
  salaryMax: "",
  salary: "",
  currency: "USD",
  description: "",
  requirements: [],
  responsibilities: [],
  skills: [],
  level: "Mid",
  yearsExp: "",
  industry: "",
  companyLogo: "",
  companySize: "",
  companyUrl: "",
  applyUrl: "",
  deadline: "",
  demandTrend: "Stable",
  isActive: true,
  featured: false,
  source: "admin",
};

export default function useJobForm(jobId) {
  const isEdit = Boolean(jobId);
  const [form, setForm] = useState(EMPTY_JOB);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load existing job when editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await axios.get(`/api/admin/jobs/${jobId}`);
        const j = data.job;
        setForm({
          ...EMPTY_JOB,
          ...j,
          salaryMin: j.salaryMin || "",
          salaryMax: j.salaryMax || "",
          yearsExp: j.yearsExp || "",
          deadline: j.deadline ? j.deadline.slice(0, 10) : "",
        });
      } catch (err) {
        showToast(
          err.response?.data?.message || "Failed to load job.",
          "error",
        );
        navigate("/admin/jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, isEdit, navigate, showToast]);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = useCallback(() => {
    const errs = [];
    if (!form.title.trim()) errs.push("Title is required.");
    if (!form.company.trim()) errs.push("Company is required.");
    if (!form.location.trim()) errs.push("Location is required.");
    if (!form.description.trim()) errs.push("Description is required.");
    if (
      form.salaryMin &&
      form.salaryMax &&
      Number(form.salaryMin) > Number(form.salaryMax)
    ) {
      errs.push("Minimum salary cannot exceed maximum salary.");
    }
    setErrors(errs);
    return errs.length === 0;
  }, [form]);

  const submit = async () => {
    if (!validate()) return false;

    setSaving(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin === "" ? 0 : Number(form.salaryMin),
        salaryMax: form.salaryMax === "" ? 0 : Number(form.salaryMax),
        yearsExp: form.yearsExp === "" ? 0 : Number(form.yearsExp),
        deadline: form.deadline || null,
      };

      if (isEdit) {
        await axios.put(`/api/admin/jobs/${jobId}`, payload);
        showToast("Job updated.", "success");
      } else {
        await axios.post("/api/admin/jobs", payload);
        showToast("Job created.", "success");
      }
      navigate("/admin/jobs");
      return true;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save job.";
      setErrors([message]);
      showToast(message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { form, setField, loading, saving, errors, submit, isEdit };
}
