import React, { useState, useRef } from 'react';
import { useAgri } from '../context/AgriContext';
import { IMAGES, GALLERY_IMAGES } from '../mockData';
import {
  formatVND,
  formatDateVN,
  getCategoryPricingGroup,
  getCategoryDisplayLabel,
  computeExtraCostsTotal,
  categorySupportsHiringMode,
  getHiringModeLabel,
  computePostGrandTotal,
  generateConsecutiveDates,
  calculateRecurringDates
} from '../utils/formatters';
import {
  PlusCircle,
  Upload,
  Check,
  Edit,
  Trash2,
  ListFilter,
  Plus,
  Image as ImageIcon,
  Link2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  Calendar,
  Repeat,
  CalendarDays,
  X
} from 'lucide-react';
import {
  ExtraCostItem,
  JointVentureTask,
  PostType,
  PricingMode,
  RecurrenceDuration,
  RecurrenceInterval,
  ServiceHiringMode,
  WorkSchedule,
  WorkScheduleType
} from '../types';

const getDefaultImageForCategory = (catId: string): string => {
  switch (catId) {
    case 'cat-1':
      return IMAGES.droneSpray;
    case 'cat-2':
    case 'cat-3':
      return IMAGES.droneSeeding;
    case 'cat-4':
    case 'cat-10':
    case 'cat-11':
      return IMAGES.harvester;
    case 'cat-5':
    case 'cat-6':
      return IMAGES.tractor;
    case 'cat-7':
      return IMAGES.laserLeveler;
    case 'cat-8':
    case 'cat-9':
      return IMAGES.irrigation;
    case 'cat-12':
      return IMAGES.transport;
    case 'cat-13':
      return IMAGES.dryer;
    default:
      return IMAGES.hero;
  }
};

const resizeImageFileToDataUrl = (file: File, maxDim = 900): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không đọc được tệp ảnh'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const CreatePostScreen: React.FC = () => {
  const {
    categories,
    currentUser,
    posts,
    createPost,
    updatePost,
    deletePost,
    setActiveTab,
    editingPost,
    setEditingPost
  } = useAgri();

  const [deleteModalPostId, setDeleteModalPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEditing = Boolean(editingPost);

  const initialPostType: PostType = editingPost
    ? editingPost.type
    : currentUser.role === 'provider'
    ? 'supply'
    : 'demand';

  // Form states initialized or synced from editingPost
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [categoryId, setCategoryId] = useState<string>(
    editingPost ? editingPost.categoryId : categories[0]?.id || 'cat-1'
  );
  const [pricingMode, setPricingMode] = useState<PricingMode>(
    editingPost?.pricingMode || 'area'
  );
  const [hiringMode, setHiringMode] = useState<ServiceHiringMode>(
    editingPost?.hiringMode || 'full_service'
  );
  const [isJointVenture, setIsJointVenture] = useState<boolean>(
    Boolean(editingPost?.isJointVenture && editingPost.type === 'demand')
  );
  const [maxPartners, setMaxPartners] = useState<number>(
    editingPost?.maxPartners || Math.max(2, editingPost?.jointVentureTasks?.length || 2)
  );
  const [jointVentureTasks, setJointVentureTasks] = useState<JointVentureTask[]>(
    editingPost?.jointVentureTasks || []
  );
  const [title, setTitle] = useState(editingPost ? editingPost.title : '');
  const [description, setDescription] = useState(editingPost ? editingPost.description : '');
  const [province, setProvince] = useState(editingPost ? editingPost.province : 'An Giang');
  const [district, setDistrict] = useState(editingPost ? editingPost.district : 'Châu Thành');
  const [locationDetail, setLocationDetail] = useState(editingPost ? editingPost.locationDetail : '');
  const [areaSize, setAreaSize] = useState<number>(editingPost ? editingPost.areaSize || 20 : 20);
  const [areaUnit, setAreaUnit] = useState(editingPost ? editingPost.areaUnit : 'ha');
  const [vehicleCount, setVehicleCount] = useState<number>(editingPost?.vehicleCount || 2);
  const [price, setPrice] = useState<number>(editingPost ? editingPost.price : 150000);
  const [priceUnit, setPriceUnit] = useState(editingPost ? editingPost.priceUnit : '₫/ha');
  const [extraCosts, setExtraCosts] = useState<ExtraCostItem[]>(editingPost?.extraCosts || []);
  const [executionDate, setExecutionDate] = useState(editingPost ? editingPost.executionDate || '2026-11-12' : '2026-11-12');
  const [scheduleType, setScheduleType] = useState<WorkScheduleType>(
    editingPost?.workSchedule?.type || 'single_day'
  );
  const [selectedDates, setSelectedDates] = useState<string[]>(
    editingPost?.workSchedule?.selectedDates || []
  );
  const [dateToAdd, setDateToAdd] = useState<string>(editingPost?.executionDate || '2026-11-12');
  const [rangeStartDate, setRangeStartDate] = useState<string>(
    editingPost?.workSchedule?.rangeStartDate || editingPost?.executionDate || '2026-11-12'
  );
  const [rangeEndDate, setRangeEndDate] = useState<string>(
    editingPost?.workSchedule?.rangeEndDate || '2026-11-16'
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>(
    editingPost?.workSchedule?.recurrenceInterval || 'every_2_days'
  );
  const [customIntervalDays, setCustomIntervalDays] = useState<number>(
    editingPost?.workSchedule?.customIntervalDays || 4
  );
  const [recurrenceDuration, setRecurrenceDuration] = useState<RecurrenceDuration>(
    editingPost?.workSchedule?.recurrenceDuration || '1_month'
  );
  const [customDurationMonths, setCustomDurationMonths] = useState<number>(
    editingPost?.workSchedule?.customDurationMonths || 2
  );
  const [recurringStartDate, setRecurringStartDate] = useState<string>(
    editingPost?.workSchedule?.startDate || editingPost?.executionDate || '2026-11-12'
  );
  const [requirements, setRequirements] = useState(editingPost ? editingPost.requirements || '' : '');
  const [equipmentCount, setEquipmentCount] = useState<number>(editingPost ? editingPost.equipmentCount || 2 : 2);
  const [capacityPerDay, setCapacityPerDay] = useState(editingPost ? editingPost.capacityPerDay || '40 ha/ngày' : '40 ha/ngày');
  const [selectedImage, setSelectedImage] = useState<string>(editingPost?.imageUrl || IMAGES.droneSpray);
  const [hasCustomImage, setHasCustomImage] = useState<boolean>(Boolean(editingPost?.imageUrl));
  const [expandGallery, setExpandGallery] = useState<boolean>(false);
  const [externalUrlInput, setExternalUrlInput] = useState<string>('');
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Filter categories strictly appropriate for selected postType
  const availableCategories = categories.filter(
    (c) => !c.supportedPostTypes || c.supportedPostTypes.includes(postType)
  );

  // Sync editingPost when selected from Home/Search/Detail
  React.useEffect(() => {
    if (editingPost) {
      if (editingPost.authorId !== currentUser.id) {
        setEditingPost(null);
        return;
      }
      const cat = categories.find((c) => c.id === editingPost.categoryId);
      const group = getCategoryPricingGroup(editingPost.categoryId, cat?.pricingGroup);
      const inferredMode: PricingMode =
        editingPost.pricingMode ||
        (group === 'weight_or_vehicle'
          ? ['xe', 'chuyến'].includes(editingPost.areaUnit)
            ? 'vehicle'
            : 'weight'
          : group === 'flexible'
          ? 'flexible'
          : 'area');

      setPostType(editingPost.type);
      setCategoryId(editingPost.categoryId);
      setPricingMode(inferredMode);
      setHiringMode(editingPost.hiringMode || 'full_service');
      setIsJointVenture(Boolean(editingPost.isJointVenture && editingPost.type === 'demand'));
      setMaxPartners(editingPost.maxPartners || Math.max(2, editingPost.jointVentureTasks?.length || 2));
      setJointVentureTasks(editingPost.jointVentureTasks || []);
      setTitle(editingPost.title);
      setDescription(editingPost.description);
      setProvince(editingPost.province);
      setDistrict(editingPost.district);
      setLocationDetail(editingPost.locationDetail || '');
      setAreaSize(editingPost.areaSize || (inferredMode === 'weight' ? 5000 : inferredMode === 'vehicle' ? 2 : 20));
      setAreaUnit(editingPost.areaUnit || 'ha');
      setVehicleCount(editingPost.vehicleCount || (inferredMode === 'vehicle' ? editingPost.areaSize || 2 : 2));
      setPrice(editingPost.price);
      setPriceUnit(editingPost.priceUnit);
      setExtraCosts(editingPost.extraCosts || []);
      setExecutionDate(editingPost.executionDate || '2026-11-12');
      setScheduleType(editingPost.workSchedule?.type || 'single_day');
      setSelectedDates(editingPost.workSchedule?.selectedDates || []);
      setDateToAdd(editingPost.executionDate || '2026-11-12');
      setRangeStartDate(editingPost.workSchedule?.rangeStartDate || editingPost.executionDate || '2026-11-12');
      setRangeEndDate(editingPost.workSchedule?.rangeEndDate || '2026-11-16');
      setRecurrenceInterval(editingPost.workSchedule?.recurrenceInterval || 'every_2_days');
      setCustomIntervalDays(editingPost.workSchedule?.customIntervalDays || 4);
      setRecurrenceDuration(editingPost.workSchedule?.recurrenceDuration || '1_month');
      setCustomDurationMonths(editingPost.workSchedule?.customDurationMonths || 2);
      setRecurringStartDate(editingPost.workSchedule?.startDate || editingPost.executionDate || '2026-11-12');
      setRequirements(editingPost.requirements || '');
      setEquipmentCount(editingPost.equipmentCount || 2);
      setCapacityPerDay(editingPost.capacityPerDay || '40 ha/ngày');
      setSelectedImage(editingPost.imageUrl || getDefaultImageForCategory(editingPost.categoryId));
      setHasCustomImage(Boolean(editingPost.imageUrl));
      setImageLoadError(false);
      setFormError(null);
    }
  }, [editingPost, currentUser.id, setEditingPost, categories]);

  const applyCategoryDefaults = (
    nextCatId: string,
    nextType: PostType,
    overrideHiringMode?: ServiceHiringMode
  ) => {
    const cat = categories.find((c) => c.id === nextCatId);
    if (!cat) return;
    const group = getCategoryPricingGroup(cat.id, cat.pricingGroup);
    const activeHiring = overrideHiringMode ?? hiringMode;
    const isMachineMode =
      categorySupportsHiringMode(cat.id, cat.supportsHiringMode) && activeHiring === 'machine_rental';

    if (isMachineMode) {
      setPricingMode('area');
      setAreaUnit('máy');
      setAreaSize(2);
      setPrice(Math.max(800000, (cat.defaultPrice || 150000) * 5));
      setPriceUnit('₫/máy');
    } else if (group === 'area_with_extras') {
      const unit = cat.defaultUnit === 'công' ? 'công' : 'ha';
      setPricingMode('area');
      setAreaUnit(unit);
      setAreaSize(nextType === 'demand' ? 20 : 10);
      setPrice(cat.defaultPrice || 150000);
      setPriceUnit(`₫/${unit}`);
    } else if (group === 'weight_or_vehicle') {
      const isVehicleDefault = cat.defaultUnit === 'xe' || cat.defaultUnit === 'chuyến';
      if (isVehicleDefault) {
        setPricingMode('vehicle');
        setAreaUnit('xe');
        setVehicleCount(2);
        setAreaSize(2);
        setPrice(cat.defaultPrice || 850000);
        setPriceUnit('₫/xe');
      } else {
        setPricingMode('weight');
        setAreaUnit('kg');
        setAreaSize(5000);
        setPrice(cat.defaultPrice || 7800);
        setPriceUnit('₫/kg');
      }
    } else {
      const unit = cat.defaultUnit || 'gói';
      setPricingMode('flexible');
      setAreaUnit(unit);
      setAreaSize(1);
      setPrice(cat.defaultPrice || 500000);
      setPriceUnit(`₫/${unit}`);
    }

    if (!hasCustomImage) {
      setSelectedImage(getDefaultImageForCategory(cat.id));
      setImageLoadError(false);
    }
  };

  const handlePostTypeChange = (nextType: PostType) => {
    setPostType(nextType);
    setFormError(null);
    if (nextType === 'supply') {
      setIsJointVenture(false);
    }
    const nextAvailable = categories.filter(
      (c) => !c.supportedPostTypes || c.supportedPostTypes.includes(nextType)
    );
    const stillValid = nextAvailable.some((c) => c.id === categoryId);
    if (!stillValid && nextAvailable.length > 0) {
      const firstId = nextAvailable[0].id;
      setCategoryId(firstId);
      if (!isEditing) {
        applyCategoryDefaults(firstId, nextType);
        setExtraCosts([]);
      }
    }
  };

  const handleToggleJointVenture = (enable: boolean) => {
    setIsJointVenture(enable);
    setFormError(null);
    if (enable && jointVentureTasks.length === 0) {
      const defaultCats = availableCategories.slice(0, 2);
      const seededTasks: JointVentureTask[] = defaultCats.map((c, idx) => {
        const grp = getCategoryPricingGroup(c.id, c.pricingGroup);
        const unit = grp === 'area_with_extras' ? 'ha' : c.defaultUnit || 'ha';
        return {
          id: `jv-task-${Date.now()}-${idx}`,
          categoryId: c.id,
          categoryName: getCategoryDisplayLabel(c, 'demand'),
          hiringMode: categorySupportsHiringMode(c.id, c.supportsHiringMode) ? 'full_service' : undefined,
          pricingMode: grp === 'weight_or_vehicle' ? (unit === 'xe' ? 'vehicle' : 'weight') : grp === 'flexible' ? 'flexible' : 'area',
          areaSize: unit === 'kg' ? 2000 : unit === 'xe' ? 2 : 15,
          areaUnit: unit,
          price: c.defaultPrice || 150000,
          note: ''
        };
      });
      setJointVentureTasks(seededTasks);
      setMaxPartners(Math.max(2, seededTasks.length));
    }
  };

  const toggleJointVentureCategory = (catId: string) => {
    const existing = jointVentureTasks.find((t) => t.categoryId === catId);
    if (existing) {
      if (jointVentureTasks.length <= 1) {
        setFormError('Hợp tác liên doanh cần tối thiểu 1 công việc dịch vụ (khuyến nghị chọn từ 2 dịch vụ trở lên).');
        return;
      }
      setJointVentureTasks((prev) => prev.filter((t) => t.categoryId !== catId));
      return;
    }
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const grp = getCategoryPricingGroup(cat.id, cat.pricingGroup);
    const unit = grp === 'area_with_extras' ? 'ha' : cat.defaultUnit || 'ha';
    const newTask: JointVentureTask = {
      id: `jv-task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      categoryId: cat.id,
      categoryName: getCategoryDisplayLabel(cat, 'demand'),
      hiringMode: categorySupportsHiringMode(cat.id, cat.supportsHiringMode) ? 'full_service' : undefined,
      pricingMode: grp === 'weight_or_vehicle' ? (unit === 'xe' ? 'vehicle' : 'weight') : grp === 'flexible' ? 'flexible' : 'area',
      areaSize: unit === 'kg' ? 2000 : unit === 'xe' ? 2 : 15,
      areaUnit: unit,
      price: cat.defaultPrice || 150000,
      note: ''
    };
    setJointVentureTasks((prev) => {
      const next = [...prev, newTask];
      if (maxPartners < next.length) {
        setMaxPartners(next.length);
      }
      return next;
    });
  };

  const updateJointVentureTask = (taskId: string, patch: Partial<JointVentureTask>) => {
    setJointVentureTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  };

  const handleJointVentureTaskHiringMode = (task: JointVentureTask, nextMode: ServiceHiringMode) => {
    const cat = categories.find((c) => c.id === task.categoryId);
    if (nextMode === 'machine_rental') {
      updateJointVentureTask(task.id, {
        hiringMode: 'machine_rental',
        areaUnit: ['máy', 'ngày', 'ca'].includes(task.areaUnit) ? task.areaUnit : 'máy',
        areaSize: ['máy', 'ngày', 'ca'].includes(task.areaUnit) ? task.areaSize : 2,
        price: ['máy', 'ngày', 'ca'].includes(task.areaUnit)
          ? task.price
          : Math.max(800000, (cat?.defaultPrice || 150000) * 5)
      });
    } else {
      const landUnit = cat?.defaultUnit === 'công' ? 'công' : 'ha';
      updateJointVentureTask(task.id, {
        hiringMode: 'full_service',
        areaUnit: ['ha', 'công'].includes(task.areaUnit) ? task.areaUnit : landUnit,
        areaSize: ['máy', 'ngày', 'ca'].includes(task.areaUnit) ? 15 : task.areaSize,
        price: ['máy', 'ngày', 'ca'].includes(task.areaUnit) ? cat?.defaultPrice || 150000 : task.price
      });
    }
  };

  const handleSingleHiringModeChange = (nextMode: ServiceHiringMode) => {
    setHiringMode(nextMode);
    if (nextMode === 'machine_rental') {
      if (!['máy', 'ngày', 'ca'].includes(areaUnit)) {
        setAreaUnit('máy');
        setPriceUnit('₫/máy');
        setAreaSize(2);
        setPrice(Math.max(800000, (selectedCategoryObj?.defaultPrice || 150000) * 5));
      }
    } else {
      const landUnit = selectedCategoryObj?.defaultUnit === 'công' ? 'công' : 'ha';
      if (['máy', 'ngày', 'ca'].includes(areaUnit)) {
        setAreaUnit(landUnit);
        setPriceUnit(`₫/${landUnit}`);
        setAreaSize(postType === 'demand' ? 20 : 10);
        setPrice(selectedCategoryObj?.defaultPrice || 150000);
      }
    }
  };

  const handleCategoryChange = (nextCatId: string) => {
    setCategoryId(nextCatId);
    setFormError(null);
    if (!isEditing) {
      applyCategoryDefaults(nextCatId, postType);
      setExtraCosts([]);
    } else {
      const cat = categories.find((c) => c.id === nextCatId);
      if (cat) {
        const group = getCategoryPricingGroup(cat.id, cat.pricingGroup);
        if (group === 'area_with_extras') {
          setPricingMode('area');
          if (!categorySupportsHiringMode(cat.id, cat.supportsHiringMode) && ['máy', 'ngày', 'ca'].includes(areaUnit)) {
            setAreaUnit('ha');
            setPriceUnit('₫/ha');
          }
        } else if (group === 'weight_or_vehicle') {
          setPricingMode(['xe', 'chuyến'].includes(areaUnit) ? 'vehicle' : 'weight');
        } else {
          setPricingMode('flexible');
        }
      }
    }
  };

  const handleSwitchWeightOrVehicle = (nextMode: 'weight' | 'vehicle') => {
    setPricingMode(nextMode);
    if (nextMode === 'vehicle') {
      const count = Math.max(1, vehicleCount || 2);
      setVehicleCount(count);
      setAreaSize(count);
      setAreaUnit('xe');
      setPriceUnit('₫/xe');
      if (price < 50000) setPrice(850000);
    } else {
      setAreaUnit('kg');
      if (areaSize < 100) setAreaSize(5000);
      setPriceUnit('₫/kg');
      if (price >= 100000) setPrice(selectedCategoryObj?.defaultUnit === 'kg' ? selectedCategoryObj.defaultPrice : 7800);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setAreaUnit(newUnit);
    setPriceUnit(`₫/${newUnit}`);
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId) || availableCategories[0];
  const currentPricingGroup = selectedCategoryObj
    ? getCategoryPricingGroup(selectedCategoryObj.id, selectedCategoryObj.pricingGroup)
    : 'area_with_extras';
  const showSingleHiringMode =
    !isJointVenture &&
    Boolean(selectedCategoryObj && categorySupportsHiringMode(selectedCategoryObj.id, selectedCategoryObj.supportsHiringMode));
  const isSingleMachineRental = showSingleHiringMode && hiringMode === 'machine_rental';

  const effectiveVolume =
    currentPricingGroup === 'weight_or_vehicle' && pricingMode === 'vehicle'
      ? Math.max(1, Number(vehicleCount) || 1)
      : Math.max(1, Number(areaSize) || 1);
  const jointVentureTasksTotal = jointVentureTasks.reduce(
    (sum, t) => sum + Math.round(Math.max(1, Number(t.areaSize) || 1) * (Number(t.price) || 0)),
    0
  );
  const baseServiceTotal =
    postType === 'demand' && isJointVenture
      ? jointVentureTasksTotal
      : Math.round(effectiveVolume * (Number(price) || 0));
  const extraCostsTotal = computeExtraCostsTotal(extraCosts);
  const estimatedGrandTotal = baseServiceTotal + extraCostsTotal;

  // Extra cost item helpers
  const addExtraCostRow = (presetLabel = '') => {
    setExtraCosts((prev) => [
      ...prev,
      {
        id: `extra-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        label: presetLabel,
        amount: 0
      }
    ]);
  };

  const updateExtraCostRow = (id: string, patch: Partial<ExtraCostItem>) => {
    setExtraCosts((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeExtraCostRow = (id: string) => {
    setExtraCosts((prev) => prev.filter((item) => item.id !== id));
  };

  // Image upload & external URL handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToDataUrl(file);
      setSelectedImage(dataUrl);
      setHasCustomImage(true);
      setImageLoadError(false);
      setFormError(null);
    } catch {
      setFormError('Không thể đọc tệp ảnh vừa chọn. Vui lòng thử lại với tệp JPG hoặc PNG.');
    }
    e.target.value = '';
  };

  const handleApplyExternalUrl = () => {
    const trimmed = externalUrlInput.trim();
    if (!trimmed) {
      setFormError('Vui lòng dán đường dẫn URL hình ảnh hợp lệ trước khi áp dụng.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith('data:image/')) {
      setFormError('Đường dẫn ảnh cần bắt đầu bằng http:// hoặc https://');
      return;
    }
    setSelectedImage(trimmed);
    setHasCustomImage(true);
    setImageLoadError(false);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim()) {
      setFormError('Vui lòng điền đầy đủ Tiêu đề và Mô tả chi tiết bài đăng.');
      return;
    }
    if (!district.trim()) {
      setFormError('Vui lòng nhập Quận / Huyện / Xã.');
      return;
    }
    if (postType === 'demand' && !locationDetail.trim()) {
      setFormError('Với bài Cần sử dụng dịch vụ, vui lòng nhập Địa điểm cụ thể / Tọa độ cánh đồng.');
      return;
    }

    if (postType === 'demand' && isJointVenture && jointVentureTasks.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 dịch vụ trong mục Hợp tác liên doanh.');
      return;
    }

    let resolvedExecutionDate = '';
    let resolvedWorkSchedule: WorkSchedule | undefined = undefined;

    if (postType === 'demand') {
      if (scheduleType === 'single_day') {
        if (!executionDate) {
          setFormError('Vui lòng chọn ngày thực hiện công việc.');
          return;
        }
        resolvedExecutionDate = executionDate;
        resolvedWorkSchedule = {
          type: 'single_day',
          singleDate: executionDate,
          totalOccurrences: 1
        };
      } else if (scheduleType === 'multi_days') {
        const sorted = Array.from(new Set(selectedDates.filter(Boolean))).sort();
        if (sorted.length === 0) {
          setFormError('Vui lòng chọn ít nhất 1 ngày làm trong mục Chọn nhiều ngày.');
          return;
        }
        resolvedExecutionDate = sorted[0];
        resolvedWorkSchedule = {
          type: 'multi_days',
          selectedDates: sorted,
          rangeStartDate: sorted[0],
          rangeEndDate: sorted[sorted.length - 1],
          totalOccurrences: sorted.length
        };
      } else {
        if (!recurringStartDate) {
          setFormError('Vui lòng chọn ngày bắt đầu cho lịch làm việc lặp lại.');
          return;
        }
        const recSummary = calculateRecurringDates(
          recurringStartDate,
          recurrenceInterval,
          customIntervalDays,
          recurrenceDuration,
          customDurationMonths
        );
        resolvedExecutionDate = recurringStartDate;
        resolvedWorkSchedule = {
          type: 'recurring',
          recurrenceInterval,
          customIntervalDays: recurrenceInterval === 'custom_days' ? Math.max(1, customIntervalDays) : undefined,
          recurrenceDuration,
          customDurationMonths: recurrenceDuration === 'custom_months' ? Math.max(1, customDurationMonths) : undefined,
          startDate: recurringStartDate,
          totalOccurrences: recSummary.totalCount
        };
      }
    }

    const cleanedExtras = extraCosts
      .filter((item) => item.label.trim() && Number(item.amount) > 0)
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        amount: Math.round(Number(item.amount))
      }));
    const cleanedExtrasTotal = computeExtraCostsTotal(cleanedExtras);
    const activeJointVenture = postType === 'demand' && isJointVenture;
    const resolvedPrimaryCatId = activeJointVenture && jointVentureTasks[0] ? jointVentureTasks[0].categoryId : categoryId;
    const resolvedCategoryLabel = activeJointVenture
      ? `Hợp tác liên doanh (${jointVentureTasks.length} dịch vụ)`
      : selectedCategoryObj
      ? getCategoryDisplayLabel(selectedCategoryObj, postType)
      : editingPost?.categoryName || 'Dịch vụ nông nghiệp';

    const finalVolume = activeJointVenture
      ? Math.max(1, jointVentureTasks[0]?.areaSize || 1)
      : currentPricingGroup === 'weight_or_vehicle' && pricingMode === 'vehicle'
      ? Math.max(1, Number(vehicleCount) || 1)
      : Math.max(1, Number(areaSize) || 1);

    const finalAreaUnit = activeJointVenture ? jointVentureTasks[0]?.areaUnit || 'ha' : areaUnit;
    const finalPrice = activeJointVenture
      ? Math.round(jointVentureTasks.reduce((s, t) => s + (Number(t.price) || 0), 0))
      : Math.max(0, Math.round(Number(price) || 0));

    const payload = {
      type: postType,
      categoryId: resolvedPrimaryCatId,
      categoryName: resolvedCategoryLabel,
      title: title.trim(),
      description: description.trim(),
      province,
      district: district.trim(),
      locationDetail: locationDetail.trim(),
      pricingMode: activeJointVenture ? 'area' : pricingMode,
      hiringMode: showSingleHiringMode ? hiringMode : undefined,
      isJointVenture: activeJointVenture,
      maxPartners: activeJointVenture ? Math.max(2, Math.min(20, Math.round(Number(maxPartners) || 2))) : undefined,
      jointVentureTasks: activeJointVenture ? jointVentureTasks : undefined,
      areaSize: finalVolume,
      areaUnit: finalAreaUnit,
      vehicleCount: !activeJointVenture && pricingMode === 'vehicle' ? finalVolume : undefined,
      price: finalPrice,
      priceUnit: `₫/${finalAreaUnit}`,
      extraCosts: cleanedExtras,
      extraCostsTotal: cleanedExtrasTotal,
      executionDate: resolvedExecutionDate,
      workSchedule: resolvedWorkSchedule,
      requirements: requirements.trim() || undefined,
      equipmentCount: postType === 'supply' ? Number(equipmentCount) : undefined,
      capacityPerDay: postType === 'supply' ? capacityPerDay : undefined,
      imageUrl: selectedImage || getDefaultImageForCategory(resolvedPrimaryCatId),
    };

    if (isEditing && editingPost) {
      const res = updatePost(editingPost.id, payload);
      if (res.success) {
        setIsSuccess(true);
        setSuccessMsg(res.message);
        setTimeout(() => {
          setIsSuccess(false);
          setEditingPost(null);
          setActiveTab('home');
        }, 1200);
      } else {
        setFormError(res.message);
      }
    } else {
      createPost({
        ...payload,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorPhone: currentUser.phone,
        authorRole: currentUser.role,
        status: 'active',
        distanceKm: Math.floor(5 + Math.random() * 20),
      });

      setIsSuccess(true);
      setSuccessMsg('Đăng bài thành công! Đang chuyển về Trang chủ sàn...');
      setTimeout(() => {
        setIsSuccess(false);
        setActiveTab('home');
      }, 1200);
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setActiveTab('home');
  };

  const provinces = ['An Giang', 'Đồng Tháp', 'Cần Thơ', 'Kiên Giang', 'Long An', 'Sóc Trăng', 'Tiền Giang', 'Vĩnh Long'];
  const visibleGallery = expandGallery ? GALLERY_IMAGES : GALLERY_IMAGES.slice(0, 4);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {isEditing ? 'Chỉnh Sửa Bài Đăng' : 'Trung Tâm Đăng Tin Nông Nghiệp'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {isEditing ? 'Chỉnh Sửa Thông Tin Bài Đăng' : 'Đăng Nhu Cầu & Dịch Vụ Mới'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isEditing
                ? 'Cập nhật lại danh mục, quy mô, vật tư thêm, đơn giá hoặc địa điểm thực hiện'
                : 'Kết nối trực tiếp giữa nông dân và chủ máy cày, máy gặt, phi đội drone, xe vận chuyển & thu mua'}
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors self-start"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>

        {/* Success Alert */}
        {isSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 animate-fade-in font-bold text-sm">
            <Check className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Inline Error Alert */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-3 font-bold text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selector */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
              Bạn muốn đăng nội dung gì?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePostTypeChange('demand')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  postType === 'demand'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-600 ring-2 ring-amber-500/30 text-amber-950 dark:text-amber-100'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">🌾</div>
                <h4 className="font-extrabold text-sm">Tôi cần sử dụng dịch vụ</h4>
                <p className="text-xs opacity-80 mt-0.5">
                  Nông dân / Chủ đất tìm thuê drone, máy gặt, bơm nước, vận chuyển...
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePostTypeChange('supply')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  postType === 'supply'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="text-2xl mb-1">🚁</div>
                <h4 className="font-extrabold text-sm">Tôi cung cấp dịch vụ</h4>
                <p className="text-xs opacity-80 mt-0.5">
                  Chủ xưởng máy, drone, doanh nghiệp thu mua, vận tải tìm khách hàng...
                </p>
              </button>
            </div>
          </div>

          {/* Demand Mode Switch: Single Service vs Joint Venture */}
          {postType === 'demand' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                  Hình thức đăng nhu cầu sử dụng dịch vụ
                </label>
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  Chọn 1 dịch vụ hoặc Hợp tác liên doanh nhiều đối tác
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleJointVenture(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !isJointVenture
                      ? 'bg-white dark:bg-slate-900 border-amber-600 ring-2 ring-amber-500/25 text-amber-950 dark:text-amber-100 shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/50 border-amber-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <p className="font-extrabold text-xs sm:text-sm">📄 Nhu cầu đơn lẻ (1 dịch vụ)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Chọn 1 dịch vụ và duyệt 1 đối tác thực hiện</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleJointVenture(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isJointVenture
                      ? 'bg-white dark:bg-slate-900 border-amber-600 ring-2 ring-amber-500/25 text-amber-950 dark:text-amber-100 shadow-xs'
                      : 'bg-white/60 dark:bg-slate-900/50 border-amber-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <p className="font-extrabold text-xs sm:text-sm">🤝 Hợp tác liên doanh (Nhiều dịch vụ & đối tác)</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Chọn nhiều dịch vụ, chia công việc & chọn nhiều người tham gia trong 1 bài</p>
                </button>
              </div>
            </div>
          )}

          {/* Category Dropdown (Single) OR Joint Venture Multi-Service Builder */}
          {postType === 'demand' && isJointVenture ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-300 dark:border-amber-800/60 space-y-5">
              {/* Max Partners Count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80 dark:border-slate-700">
                <div className="space-y-0.5">
                  <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Số lượng đối tác tối đa được tham gia cung cấp dịch vụ</span>
                  </label>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Mỗi đối tác được chọn từ danh sách chờ sẽ ký 1 hợp đồng phần việc riêng và tự cập nhật tiến độ.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {[2, 3, 4, 5].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxPartners(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold font-mono border transition-colors ${
                        maxPartners === preset
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={maxPartners}
                    onChange={(e) => setMaxPartners(Math.max(2, Math.min(20, Number(e.target.value) || 2)))}
                    className="w-16 px-2.5 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-400 dark:border-amber-700 text-xs font-extrabold font-mono tabular-nums text-center text-slate-900 dark:text-white"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">người</span>
                </div>
              </div>

              {/* Multi-Service Selector Chips */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200">
                    Chọn nhiều dịch vụ trong gói hợp tác liên doanh ({jointVentureTasks.length} đã chọn)
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((c) => {
                    const checked = jointVentureTasks.some((t) => t.categoryId === c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleJointVentureCategory(c.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          checked
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span>{getCategoryDisplayLabel(c, 'demand')}</span>
                        {checked && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Configured Joint Venture Task Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200">
                  Chi tiết từng công việc & Hình thức thuê ({jointVentureTasks.length} đầu việc)
                </h4>
                {jointVentureTasks.map((task, idx) => {
                  const catObj = categories.find((c) => c.id === task.categoryId);
                  const supportsHire = categorySupportsHiringMode(task.categoryId, catObj?.supportsHiringMode);
                  const grp = getCategoryPricingGroup(task.categoryId, catObj?.pricingGroup);
                  const taskSubtotal = Math.round(Math.max(1, task.areaSize || 1) * (task.price || 0));
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white min-w-0 flex-1 leading-snug">
                          {idx + 1}. {catObj?.icon || '🌾'} {task.categoryName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                          <span className="font-extrabold font-mono tabular-nums text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            {formatVND(taskSubtotal)}
                          </span>
                          {jointVentureTasks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setJointVentureTasks((prev) => prev.filter((t) => t.id !== task.id))}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 shrink-0"
                              title="Xóa công việc này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2-way Hiring Mode for cat-1..cat-6 */}
                      {supportsHire && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleJointVentureTaskHiringMode(task, 'machine_rental')}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold text-left transition-all ${
                              task.hiringMode === 'machine_rental'
                                ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-600 text-amber-950 dark:text-amber-100'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            🚜 Thuê máy để tự làm
                          </button>
                          <button
                            type="button"
                            onClick={() => handleJointVentureTaskHiringMode(task, 'full_service')}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold text-left transition-all ${
                              (task.hiringMode || 'full_service') === 'full_service'
                                ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-600 text-amber-950 dark:text-amber-100'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            👷 Thuê người làm hộ
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            {supportsHire && task.hiringMode === 'machine_rental'
                              ? 'Số lượng máy để thuê'
                              : grp === 'area_with_extras'
                              ? 'Diện tích đất'
                              : 'Khối lượng / Quy mô'}
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="1"
                              value={task.areaSize}
                              onChange={(e) =>
                                updateJointVentureTask(task.id, { areaSize: Math.max(1, Number(e.target.value) || 1) })
                              }
                              className="w-3/5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold font-mono tabular-nums"
                            />
                            <select
                              value={task.areaUnit}
                              onChange={(e) => updateJointVentureTask(task.id, { areaUnit: e.target.value })}
                              className="w-2/5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold"
                            >
                              {supportsHire && task.hiringMode === 'machine_rental' ? (
                                <>
                                  <option value="máy">máy</option>
                                  <option value="ngày">ngày</option>
                                  <option value="ca">ca</option>
                                </>
                              ) : grp === 'weight_or_vehicle' ? (
                                <>
                                  <option value="kg">kg</option>
                                  <option value="tấn">tấn</option>
                                  <option value="xe">xe</option>
                                  <option value="chuyến">chuyến</option>
                                </>
                              ) : (
                                <>
                                  <option value="ha">ha</option>
                                  <option value="công">công</option>
                                  <option value="gói">gói</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            {supportsHire && task.hiringMode === 'machine_rental'
                              ? `Chi phí thuê mỗi ${task.areaUnit} (VNĐ)`
                              : `Đơn giá (VNĐ / ${task.areaUnit})`}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={task.price}
                            onChange={(e) =>
                              updateJointVentureTask(task.id, { price: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Ghi chú chia việc</label>
                          <input
                            type="text"
                            value={task.note || ''}
                            onChange={(e) => updateJointVentureTask(task.id, { note: e.target.value })}
                            placeholder="VD: Khu A, buổi sáng..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    Danh mục dịch vụ ({postType === 'demand' ? 'Dành cho người cần thuê' : 'Dành cho bên cung cấp'})
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {availableCategories.length} mục phù hợp
                  </span>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {getCategoryDisplayLabel(c, postType)}
                    </option>
                  ))}
                </select>
                {selectedCategoryObj?.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    {selectedCategoryObj.description}
                  </p>
                )}
              </div>

              {/* 2-Option Hiring Mode for Spraying / Seeding / Fertilizer / Harvesting / Plowing / Harrowing */}
              {showSingleHiringMode && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-slate-200">
                    {postType === 'demand'
                      ? 'Chọn hình thức thuê máy móc / nhân công (2 trường hợp)'
                      : 'Chọn hình thức cung cấp dịch vụ (2 trường hợp)'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSingleHiringModeChange('machine_rental')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        hiringMode === 'machine_rental'
                          ? postType === 'demand'
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-600 ring-2 ring-amber-500/25 text-amber-950 dark:text-amber-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 ring-2 ring-emerald-500/25 text-emerald-950 dark:text-emerald-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <p className="font-extrabold text-xs sm:text-sm">
                        {postType === 'demand' ? '🚜 1. Thuê máy để tự làm' : '🚜 1. Cho thuê máy tự làm'}
                      </p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {postType === 'demand'
                          ? 'Chỉ thuê số lượng máy & tính theo chi phí thuê mỗi máy (không tính theo ha)'
                          : 'Cho thuê theo số lượng máy để khách tự lái & tự vận hành'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSingleHiringModeChange('full_service')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        hiringMode === 'full_service'
                          ? postType === 'demand'
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-600 ring-2 ring-amber-500/25 text-amber-950 dark:text-amber-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 ring-2 ring-emerald-500/25 text-emerald-950 dark:text-emerald-100'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <p className="font-extrabold text-xs sm:text-sm">
                        {postType === 'demand' ? '👷 2. Thuê người làm hộ' : '👷 2. Cung cấp trọn gói (Có người làm)'}
                      </p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {postType === 'demand'
                          ? 'Thuê trọn gói kèm tài xế / phi công drone trực tiếp thực hiện theo diện tích (ha)'
                          : 'Có đội ngũ thợ lái / phi công trực tiếp thi công trọn gói theo ha'}
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Post Title */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Tiêu đề bài đăng
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                postType === 'demand'
                  ? 'Ví dụ: Cần thuê drone phun thuốc cho 25 ha lúa tại Châu Thành...'
                  : 'Ví dụ: Đội 3 máy gặt Kubota DC-95X nhận cắt vụ Đông Xuân...'
              }
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white font-semibold"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Mô tả chi tiết yêu cầu / năng lực
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể về tình trạng ruộng, loại hàng hóa, đường vào ruộng, cam kết làm việc..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white"
            />
          </div>

          {/* Location Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tỉnh / Thành phố
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white font-medium"
                >
                  {provinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Quận / Huyện / Xã
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Ví dụ: Huyện Châu Thành, Xã Vĩnh Hanh"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Conditional Location Detail */}
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                {postType === 'demand'
                  ? 'Địa điểm cụ thể / Tọa độ cánh đồng (Bắt buộc)'
                  : 'Địa chỉ xưởng / Bãi xe / Cơ sở (Tùy chọn)'}
              </label>
              <input
                type="text"
                required={postType === 'demand'}
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder={
                  postType === 'demand'
                    ? 'Ví dụ: Cánh đồng mẫu lớn ấp Vĩnh Lộc, cạnh cống Năm Hạnh'
                    : 'Ví dụ: Xưởng máy Quốc lộ 91, ấp Bình An (có thể bỏ trống nếu chạy lưu động)'
                }
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Context-Smart Pricing, Quantity & Extra Material Costs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {isSingleMachineRental
                  ? 'Số lượng máy thuê, Chi phí mỗi máy & Phụ phí'
                  : 'Quy mô, Đơn giá & Chi phí vật tư kèm theo'}
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isSingleMachineRental
                  ? 'Thuê máy tự làm: tính theo số lượng máy & chi phí thuê mỗi máy (không tính ha)'
                  : currentPricingGroup === 'area_with_extras'
                  ? 'Nhóm dịch vụ canh tác tính theo diện tích đất (ha / công)'
                  : currentPricingGroup === 'weight_or_vehicle'
                  ? 'Nhóm thu mua / vận chuyển / sấy tính theo đồng/kg hoặc số lượng xe'
                  : 'Nhóm dịch vụ linh hoạt'}
              </span>
            </div>

            {/* Mode Switcher for Procurement / Transport / Drying */}
            {currentPricingGroup === 'weight_or_vehicle' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleSwitchWeightOrVehicle('weight')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                    pricingMode === 'weight'
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⚖️ Tính theo khối lượng (đồng / kg hoặc tấn)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchWeightOrVehicle('vehicle')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                    pricingMode === 'vehicle'
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🚚 Tính theo số lượng xe / chuyến (đồng / xe)
                </button>
              </div>
            )}

            {/* Main Quantity & Unit Price Row (2 columns; schedule picker sits below for demand only) */}
            {postType === 'demand' && isJointVenture ? (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  Tổng quy mô gói Hợp tác liên doanh:
                </span>
                <span className="font-extrabold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                  {jointVentureTasks.length} dịch vụ · Tối đa {maxPartners} đối tác tham gia
                </span>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity Field */}
              {currentPricingGroup === 'weight_or_vehicle' && pricingMode === 'vehicle' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {postType === 'demand' ? 'Số lượng xe cần dùng' : 'Số xe phục vụ / Gói chuẩn'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={vehicleCount}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setVehicleCount(val);
                        setAreaSize(val);
                      }}
                      className="w-3/5 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                    <select
                      value={areaUnit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="w-2/5 px-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <option value="xe">xe</option>
                      <option value="chuyến">chuyến</option>
                    </select>
                  </div>
                </div>
              ) : isSingleMachineRental ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {postType === 'demand' ? 'Số lượng máy để thuê' : 'Số lượng máy cho thuê'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={areaSize}
                      onChange={(e) => setAreaSize(Math.max(1, Number(e.target.value) || 1))}
                      className="w-3/5 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                    <select
                      value={areaUnit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="w-2/5 px-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <option value="máy">máy</option>
                      <option value="ngày">ngày</option>
                      <option value="ca">ca</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {currentPricingGroup === 'area_with_extras'
                      ? postType === 'demand'
                        ? 'Diện tích đất (ha / công)'
                        : 'Diện tích nhận làm hộ (ha / công)'
                      : currentPricingGroup === 'weight_or_vehicle'
                      ? 'Sản lượng / Khối lượng'
                      : 'Số lượng dự kiến'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      required
                      value={areaSize}
                      onChange={(e) => setAreaSize(Math.max(1, Number(e.target.value) || 1))}
                      className="w-3/5 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white"
                    />
                    <select
                      value={areaUnit}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="w-2/5 px-2 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      {currentPricingGroup === 'area_with_extras' ? (
                        <>
                          <option value="ha">ha</option>
                          <option value="công">công</option>
                        </>
                      ) : currentPricingGroup === 'weight_or_vehicle' ? (
                        <>
                          <option value="kg">kg</option>
                          <option value="tấn">tấn</option>
                        </>
                      ) : (
                        <>
                          <option value="gói">gói</option>
                          <option value="ha">ha</option>
                          <option value="công">công</option>
                          <option value="kg">kg</option>
                          <option value="tấn">tấn</option>
                          <option value="xe">xe</option>
                          <option value="giờ">giờ</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {/* Unit Price */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {isSingleMachineRental
                    ? `Chi phí thuê mỗi ${areaUnit} (VNĐ)`
                    : `Đơn giá (VNĐ / ${areaUnit})`}
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400"
                />
                <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-baseline gap-x-1">
                  <span className="whitespace-nowrap">{formatVND(price)}</span>
                  <span className="whitespace-nowrap">/ {areaUnit}</span>
                </span>
              </div>
            </div>
            )}

            {/* Work Schedule Picker: ONLY for Demand (Người thuê); Providers do NOT set work dates */}
            {postType === 'demand' ? (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Chọn Ngày Làm & Lịch Thực Hiện Công Việc (Người thuê)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chọn 1 ngày cụ thể, chọn nhiều ngày liên tiếp / rời rạc, hoặc thiết lập lịch lặp lại định kỳ theo tháng/năm.
                    </p>
                  </div>
                </div>

                {/* 3 Mode Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleType('single_day')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                      scheduleType === 'single_day'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Chọn 1 ngày</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleType('multi_days');
                      if (selectedDates.length === 0 && executionDate) {
                        setSelectedDates([executionDate]);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                      scheduleType === 'multi_days'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span>Chọn nhiều ngày</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('recurring')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                      scheduleType === 'recurring'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-500'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5 shrink-0" />
                    <span>Chọn ngày lặp lại</span>
                  </button>
                </div>

                {/* Mode 1: Single Specific Day */}
                {scheduleType === 'single_day' && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Ngày thực hiện cụ thể:
                    </label>
                    <input
                      type="date"
                      required
                      value={executionDate}
                      onChange={(e) => setExecutionDate(e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ({formatDateVN(executionDate)})
                    </span>
                  </div>
                )}

                {/* Mode 2: Multi Days (Consecutive Range Across Months OR Pick Multiple Individual Dates) */}
                {scheduleType === 'multi_days' && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 space-y-4 text-xs">
                    {/* Option A: Consecutive date range */}
                    <div className="space-y-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                        Cách 1: Chọn nhiều ngày liên tiếp (có thể nhiều tháng)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-semibold">Từ:</span>
                          <input
                            type="date"
                            value={rangeStartDate}
                            onChange={(e) => setRangeStartDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-semibold">Đến:</span>
                          <input
                            type="date"
                            value={rangeEndDate}
                            onChange={(e) => setRangeEndDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateConsecutiveDates(rangeStartDate, rangeEndDate);
                            if (generated.length === 0) {
                              setFormError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
                              return;
                            }
                            setFormError(null);
                            setSelectedDates((prev) => Array.from(new Set([...prev, ...generated])).sort());
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap"
                        >
                          Áp dụng dãy ngày
                        </button>
                      </div>
                    </div>

                    {/* Option B: Add single arbitrary date */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">
                        Cách 2: Thêm từng ngày cụ thể vào danh sách
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="date"
                          value={dateToAdd}
                          onChange={(e) => setDateToAdd(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-bold font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!dateToAdd) return;
                            setSelectedDates((prev) => Array.from(new Set([...prev, dateToAdd])).sort());
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold flex items-center gap-1 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm ngày này</span>
                        </button>
                      </div>
                    </div>

                    {/* Selected dates list */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Danh sách ngày đã chọn ({selectedDates.length} ngày):
                        </span>
                        {selectedDates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedDates([])}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            Xóa tất cả
                          </button>
                        )}
                      </div>
                      {selectedDates.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          Chưa có ngày nào. Chọn khoảng ngày liên tiếp hoặc nhấn "Thêm ngày này" ở trên.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                          {selectedDates.map((d) => (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 font-mono font-bold text-[11px]"
                            >
                              <span>{formatDateVN(d)}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedDates((prev) => prev.filter((item) => item !== d))}
                                className="text-amber-800 dark:text-amber-300 hover:text-rose-600"
                                title="Bỏ ngày này"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mode 3: Recurring Schedule */}
                {scheduleType === 'recurring' && (() => {
                  const recPreview = calculateRecurringDates(
                    recurringStartDate,
                    recurrenceInterval,
                    customIntervalDays,
                    recurrenceDuration,
                    customDurationMonths
                  );
                  return (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Ngày bắt đầu lịch lặp lại
                          </label>
                          <input
                            type="date"
                            required
                            value={recurringStartDate}
                            onChange={(e) => setRecurringStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold font-mono"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70">
                            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                              Tổng số lần dự kiến: <strong className="font-mono text-sm">{recPreview.totalCount} lần</strong>
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                              Từ {formatDateVN(recurringStartDate)} → {formatDateVN(recPreview.endDateStr)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recurrence Frequency */}
                      <div className="space-y-2">
                        <label className="block font-extrabold text-slate-800 dark:text-slate-200">
                          Chu kỳ lặp lại công việc
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              { id: 'daily', label: 'Hàng ngày' },
                              { id: 'every_2_days', label: '2 ngày 1 lần' },
                              { id: 'every_3_days', label: '3 ngày 1 lần' },
                              { id: 'weekly', label: '1 tuần 1 lần' },
                              { id: 'biweekly', label: '2 tuần 1 lần' },
                              { id: 'monthly', label: '1 tháng 1 lần' },
                              { id: 'custom_days', label: 'Tùy chỉnh ngày' }
                            ] as { id: RecurrenceInterval; label: string }[]
                          ).map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setRecurrenceInterval(opt.id)}
                              className={`px-3 py-1.5 rounded-lg border font-bold transition-colors whitespace-nowrap ${
                                recurrenceInterval === opt.id
                                  ? 'bg-amber-600 text-white border-amber-700'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {recurrenceInterval === 'custom_days' && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Lặp mỗi:</span>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={customIntervalDays}
                              onChange={(e) => setCustomIntervalDays(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
                              className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-amber-400 font-bold font-mono text-center"
                            />
                            <span className="font-semibold text-slate-600 dark:text-slate-300">ngày / 1 lần</span>
                          </div>
                        )}
                      </div>

                      {/* Recurrence Duration */}
                      <div className="space-y-2">
                        <label className="block font-extrabold text-slate-800 dark:text-slate-200">
                          Thời hạn kéo dài trong bao lâu
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              { id: '1_week', label: '1 tuần' },
                              { id: '2_weeks', label: '2 tuần' },
                              { id: '1_month', label: '1 tháng' },
                              { id: '3_months', label: '3 tháng' },
                              { id: '6_months', label: '6 tháng' },
                              { id: '1_year', label: '1 năm' },
                              { id: 'custom_months', label: 'Tùy chỉnh tháng' }
                            ] as { id: RecurrenceDuration; label: string }[]
                          ).map((dur) => (
                            <button
                              key={dur.id}
                              type="button"
                              onClick={() => setRecurrenceDuration(dur.id)}
                              className={`px-3 py-1.5 rounded-lg border font-bold transition-colors whitespace-nowrap ${
                                recurrenceDuration === dur.id
                                  ? 'bg-emerald-700 text-white border-emerald-800'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                              }`}
                            >
                              {dur.label}
                            </button>
                          ))}
                        </div>
                        {recurrenceDuration === 'custom_months' && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">Trong thời hạn:</span>
                            <input
                              type="number"
                              min="1"
                              max="36"
                              value={customDurationMonths}
                              onChange={(e) => setCustomDurationMonths(Math.max(1, Math.min(36, Number(e.target.value) || 1)))}
                              className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-emerald-500 font-bold font-mono text-center"
                            />
                            <span className="font-semibold text-slate-600 dark:text-slate-300">tháng</span>
                          </div>
                        )}
                      </div>

                      {/* Preview Dates */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          Các buổi dự kiến đầu tiên ({recPreview.intervalLabel} trong {recPreview.durationLabel}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {recPreview.previewDates.map((pd) => (
                            <span
                              key={pd}
                              className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200"
                            >
                              {formatDateVN(pd)}
                            </span>
                          ))}
                          {recPreview.totalCount > recPreview.previewDates.length && (
                            <span className="text-[11px] font-semibold text-slate-500 self-center">
                              ... (+{recPreview.totalCount - recPreview.previewDates.length} buổi nữa)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>
                  Bài cung cấp dịch vụ không cần ghi ngày cố định — người thuê sẽ chọn ngày làm cụ thể khi bấm tham gia hợp đồng.
                </span>
              </div>
            )}

            {/* Extra Material / Surcharge Costs Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                    Chi phí vật tư & Phụ phí kèm theo (Tùy chọn)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ví dụ: phân bón, thuốc trừ sâu, giống sạ, tiền nước, công bốc xếp... Khoản này sẽ cộng thẳng vào tổng giá trị hợp đồng khi thanh toán.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addExtraCostRow('')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-600 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm chi phí</span>
                </button>
              </div>

              {/* Quick Suggested Preset Buttons */}
              {selectedCategoryObj?.suggestedExtras && selectedCategoryObj.suggestedExtras.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Gợi ý nhanh:
                  </span>
                  {selectedCategoryObj.suggestedExtras.map((presetLabel) => {
                    const alreadyAdded = extraCosts.some(
                      (item) => item.label.trim().toLowerCase() === presetLabel.toLowerCase()
                    );
                    return (
                      <button
                        key={presetLabel}
                        type="button"
                        onClick={() => {
                          if (!alreadyAdded) addExtraCostRow(presetLabel);
                        }}
                        disabled={alreadyAdded}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                          alreadyAdded
                            ? 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 cursor-default'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {alreadyAdded ? `✓ ${presetLabel}` : `+ ${presetLabel}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Extra Cost Rows */}
              {extraCosts.length > 0 && (
                <div className="space-y-2">
                  {extraCosts.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateExtraCostRow(item.id, { label: e.target.value })}
                        placeholder="Tên vật tư / phụ phí (VD: Phân bón NPK, Thuốc BVTV...)"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                      />
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-44">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={item.amount}
                            onChange={(e) =>
                              updateExtraCostRow(item.id, {
                                amount: Math.max(0, Number(e.target.value) || 0)
                              })
                            }
                            placeholder="Số tiền (VNĐ)"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExtraCostRow(item.id)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Xóa khoản chi phí này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Cost Breakdown Summary */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/70 space-y-2 text-xs">
              <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-between gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
                <span className="min-w-0 flex-1 leading-snug">
                  {postType === 'demand' && isJointVenture
                    ? `Tổng các dịch vụ liên doanh (${jointVentureTasks.length} công đoạn · tối đa ${maxPartners} đối tác):`
                    : isSingleMachineRental
                    ? `Chi phí thuê máy (${effectiveVolume} ${areaUnit} × ${formatVND(price)}/${areaUnit}):`
                    : `Tiền dịch vụ cơ bản (${effectiveVolume} ${areaUnit} × ${formatVND(price)}):`}
                </span>
                <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white whitespace-nowrap shrink-0 ml-auto text-right">
                  {formatVND(baseServiceTotal)}
                </span>
              </div>
              {extraCostsTotal > 0 && (
                <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-between gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
                  <span className="min-w-0 flex-1 leading-snug">
                    Tổng chi phí vật tư / phụ phí thêm ({extraCosts.filter((e) => e.amount > 0).length} mục):
                  </span>
                  <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0 ml-auto text-right">
                    + {formatVND(extraCostsTotal)}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-slate-900 dark:text-white leading-snug">
                  Tổng giá trị hợp đồng tạm tính:
                </span>
                <span
                  className={`${
                    estimatedGrandTotal >= 1_000_000_000 ? 'text-sm sm:text-base' : 'text-[15px] sm:text-base'
                  } font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0 ml-auto text-right`}
                >
                  {formatVND(estimatedGrandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Provider Machinery Specifics */}
          {postType === 'supply' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div>
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase mb-1">
                  Số lượng máy móc / Xe sẵn có
                </label>
                <input
                  type="number"
                  min="1"
                  value={equipmentCount}
                  onChange={(e) => setEquipmentCount(Number(e.target.value))}
                  placeholder="Ví dụ: 2 drone, 3 xe tải..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase mb-1">
                  Năng suất / Công suất ngày
                </label>
                <input
                  type="text"
                  value={capacityPerDay}
                  onChange={(e) => setCapacityPerDay(e.target.value)}
                  placeholder="Ví dụ: 50 ha/ngày, 30 tấn/ngày..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Optional Technical Requirements */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Yêu cầu kỹ thuật / Ghi chú hợp đồng (Tùy chọn)
            </label>
            <input
              type="text"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Ví dụ: Làm sáng sớm 5h-9h, thanh toán nghiệm thu theo tiến độ..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white"
            />
          </div>

          {/* Expanded Image Gallery + Upload from Device + External URL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Hình ảnh đại diện bài đăng
                </label>
              </div>
              <button
                type="button"
                onClick={() => setExpandGallery((prev) => !prev)}
                className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-center"
              >
                {expandGallery ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Thu gọn kho ảnh</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Mở rộng kho ảnh (+{GALLERY_IMAGES.length - 4} ảnh nông nghiệp)</span>
                  </>
                )}
              </button>
            </div>

            {/* Active Image Preview + Device Upload */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center">
                {imageLoadError ? (
                  <div className="p-3 text-center text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Không tải được ảnh từ URL này. Vui lòng kiểm tra lại liên kết hoặc chọn ảnh trong kho.
                  </div>
                ) : (
                  <img
                    src={selectedImage}
                    alt="Ảnh đại diện đang chọn"
                    onError={() => setImageLoadError(true)}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <div className="flex-1 space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-600 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn ảnh từ thiết bị</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={externalUrlInput}
                      onChange={(e) => setExternalUrlInput(e.target.value)}
                      placeholder="Hoặc dán đường dẫn ảnh (URL) bên ngoài..."
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyExternalUrl}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold shrink-0 transition-colors"
                  >
                    Áp dụng URL
                  </button>
                </div>
              </div>
            </div>

            {/* Built-in Agricultural Image Gallery */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {visibleGallery.map((img) => {
                const isSelected = selectedImage === img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setSelectedImage(img.url);
                      setHasCustomImage(true);
                      setImageLoadError(false);
                    }}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all text-left ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-20 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[10px] text-center py-1 px-1 font-bold truncate">
                      {img.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button & Edit Mode Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="sm:w-1/4 py-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingPost) setDeleteModalPostId(editingPost.id);
                  }}
                  className="sm:w-1/4 py-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>XÓA BÀI NÀY</span>
                </button>
              </>
            )}
            <button
              type="submit"
              className={`${
                isEditing ? 'sm:w-1/2' : 'w-full'
              } py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-lg shadow-emerald-700/30 transition-transform active:scale-[0.99] flex items-center justify-center gap-2`}
            >
              <PlusCircle className="w-5 h-5" />
              <span>
                {isEditing
                  ? 'LƯU THAY ĐỔI BÀI ĐĂNG'
                  : postType === 'demand'
                  ? 'ĐĂNG NHU CẦU THUÊ DỊCH VỤ'
                  : 'ĐĂNG BÀI CUNG CẤP DỊCH VỤ'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Managed Posts Section */}
      {(() => {
        const isAdmin = currentUser.role === 'admin';
        const managedPosts = isAdmin ? posts : posts.filter((p) => p.authorId === currentUser.id);
        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {isAdmin
                    ? `Quản Lý Tất Cả Bài Đăng Trên Sàn (Quyền Admin - ${managedPosts.length} bài)`
                    : `Bài Đăng Của Bạn (${managedPosts.length} bài)`}
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin
                  ? 'Admin có quyền Xóa mọi bài đăng; chỉ tác giả mới được Chỉnh sửa bài của mình'
                  : 'Chỉ bạn mới có quyền Chỉnh sửa hoặc XÓA các bài đăng của mình'}
              </span>
            </div>

            {managedPosts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tài khoản hiện tại chưa tạo bài đăng nào. Hãy điền biểu mẫu ở trên để đăng bài đầu tiên!
              </div>
            ) : (
              <div className="space-y-3">
                {managedPosts.map((p) => {
                  const isSelectedForEdit = editingPost?.id === p.id;
                  const isMine = p.authorId === currentUser.id;
                  const extrasSum = computeExtraCostsTotal(p.extraCosts);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isSelectedForEdit
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-extrabold ${
                              p.type === 'demand'
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {p.type === 'demand' ? '🌾 Nhu Cầu' : '🚁 Dịch Vụ'}
                          </span>
                          <span aria-hidden="true" className="text-slate-400">·</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{p.categoryName}</span>
                          {isMine && (
                            <>
                              <span aria-hidden="true" className="text-slate-400">·</span>
                              <span className="font-bold text-blue-700 dark:text-blue-300">Của bạn</span>
                            </>
                          )}
                          {isSelectedForEdit && (
                            <>
                              <span aria-hidden="true" className="text-slate-400">·</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-300">Đang mở sửa</span>
                            </>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {p.title}
                        </h4>
                        <p className="text-emerald-700 dark:text-emerald-400 font-bold font-mono tabular-nums leading-relaxed break-words">
                          {p.isJointVenture && p.jointVentureTasks ? (
                            <>
                              <span>Hợp tác liên doanh ({p.jointVentureTasks.length} dịch vụ · {p.maxPartners || p.jointVentureTasks.length} đối tác) · Tổng </span>
                              <span className="whitespace-nowrap">{formatVND(computePostGrandTotal(p))}</span>
                            </>
                          ) : (
                            <>
                              <span className="whitespace-nowrap">{formatVND(p.price)}</span>
                              <span> / {p.priceUnit.replace('₫/', '')}</span>
                              {p.hiringMode ? ` · ${getHiringModeLabel(p.hiringMode, p.type)}` : ''}
                              {extrasSum > 0 ? (
                                <>
                                  {' '}
                                  (+ <span className="whitespace-nowrap">{formatVND(extrasSum)}</span> vật tư thêm)
                                </>
                              ) : null}
                            </>
                          )}{' '}
                          · {p.district}, {p.province}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPost(p);
                              document.getElementById('app-main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold flex items-center gap-1.5 transition-colors border border-emerald-300 dark:border-emerald-700"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Chỉnh sửa</span>
                          </button>
                        )}

                        {(isMine || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => setDeleteModalPostId(p.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>XÓA BÀI</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Delete Modal */}
      {deleteModalPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Xác nhận xóa bài đăng?</h4>
              <p className="text-xs text-slate-500 mt-1">Bài đăng này sẽ bị xóa khỏi trang chủ và toàn sàn.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalPostId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePost(deleteModalPostId);
                  if (editingPost?.id === deleteModalPostId) {
                    setEditingPost(null);
                  }
                  setDeleteModalPostId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
