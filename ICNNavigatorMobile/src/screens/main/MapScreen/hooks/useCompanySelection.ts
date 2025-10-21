import { CAMERA_ANIM_MS } from "../constants/mapConstants";
import { Company } from "@/types";
import { useState, useRef, useCallback } from "react";
import { Animated } from "react-native";

export function useCompanySelection(navigation: any) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFromDropdownSelection, setIsFromDropdownSelection] = useState(false);
  const slideAnimation = useRef(new Animated.Value(300)).current;
  const markerRefs = useRef<Record<string, any>>({});

  // 修复：使用 useCallback 包装所有函数
  const closeCompanyCard = useCallback((
    searchText: string, 
    setSearchText: React.Dispatch<React.SetStateAction<string>>,
    opts?: { clearSearch?: boolean; animate?: boolean }
  ) => {
    if (!selectedCompany) return;
    
    markerRefs.current[selectedCompany.id]?.hideCallout();
    
    const { clearSearch = false, animate = true } = opts || {};

    const doClearSearch = () => {
      if (clearSearch && selectedCompany && searchText.trim().toLowerCase() === selectedCompany.name.trim().toLowerCase()) {
        setSearchText('');
      }
    };

    const finish = () => {
      setSelectedCompany(null);
    };

    if (animate) {
      Animated.timing(slideAnimation, { toValue: 300, duration: 250, useNativeDriver: true }).start(() => {
        doClearSearch();
        finish();
      });
    } else {
      doClearSearch();
      finish();
    }
  }, [selectedCompany, slideAnimation]);

  const animateToCompany = useCallback((company: Company) => {
    setSelectedCompany(company);
    Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }, [slideAnimation]);

  const handleMarkerPress = useCallback((company: Company) => {
    setIsFromDropdownSelection(false);
    animateToCompany(company);
  }, [animateToCompany]);

  const navigateToDetail = useCallback((company: Company) => {
    navigation.navigate('CompanyDetail', { company });
  }, [navigation]);

  const handleCalloutPress = useCallback((company: Company) => {
    navigateToDetail(company);
  }, [navigateToDetail]);

  const handleCompanySelection = useCallback((
    company: Company, 
    setSearchText: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (selectedCompany) {
      closeCompanyCard('', setSearchText, { clearSearch: false, animate: false });
    }
    
    setIsFromDropdownSelection(true);

    setTimeout(() => {
      setSearchText(company.name);
      setSelectedCompany(company);
      Animated.timing(slideAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();

      const marker = markerRefs.current[company.id];
      if (marker && marker.showCallout) {
        marker.showCallout();
      }

      setIsFromDropdownSelection(false);
    }, CAMERA_ANIM_MS);
  }, [selectedCompany, closeCompanyCard, slideAnimation]);

  return {
    selectedCompany,
    isFromDropdownSelection,
    markerRefs,
    slideAnimation,
    handleCompanySelection,
    handleMarkerPress,
    handleCalloutPress,
    closeCompanyCard,
    navigateToDetail
  };
}